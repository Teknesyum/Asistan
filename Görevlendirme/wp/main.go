package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"image"
	"image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/appstate"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
	"google.golang.org/protobuf/proto"
)

type istek struct {
	ID       int      `json:"id"`
	Op       string   `json:"op"`
	Q        string   `json:"q"`
	JID      string   `json:"jid"`
	Dosyalar []string `json:"dosyalar"`
}

type hedef struct {
	JID string `json:"jid"`
	Ad  string `json:"ad"`
	Tur string `json:"tur"`
	Alt string `json:"alt,omitempty"`
}

var (
	yazKilit sync.Mutex
	cikis    = json.NewEncoder(os.Stdout)
	cli      *whatsmeow.Client
	kap      *sqlstore.Container
	ctx      = context.Background()
	qrIptal  context.CancelFunc
	qrKilit  sync.Mutex
	kucuk    = cases.Lower(language.Turkish)
)

func yolla(v any) {
	yazKilit.Lock()
	defer yazKilit.Unlock()
	_ = cikis.Encode(v)
}

func cevap(id int, veri any, err error) {
	if err != nil {
		yolla(map[string]any{"id": id, "ok": false, "hata": err.Error()})
		return
	}
	yolla(map[string]any{"id": id, "ok": true, "veri": veri})
}

func durum() map[string]any {
	d := map[string]any{"ev": "durum", "bagli": false, "cevrimici": false}
	if cli != nil && cli.Store.ID != nil {
		d["bagli"] = true
		d["numara"] = cli.Store.ID.User
		d["ad"] = cli.Store.PushName
		d["cevrimici"] = cli.IsConnected() && cli.IsLoggedIn()
	}
	return d
}

func olay(e any) {
	switch v := e.(type) {
	case *events.Connected, *events.PushNameSetting:
		yolla(durum())
	case *events.Disconnected:
		yolla(durum())
	case *events.LoggedOut:
		yeniCihaz()
		yolla(durum())
	case *events.PairSuccess:
		go func() {
			time.Sleep(3 * time.Second)
			rehberCek(true)
		}()
		_ = v
	}
}

func yeniCihaz() {
	if cli != nil {
		cli.Disconnect()
	}
	dev := kap.NewDevice()
	cli = whatsmeow.NewClient(dev, waLog.Noop)
	cli.AddEventHandler(olay)
}

func rehberCek(tam bool) {
	for _, ad := range []appstate.WAPatchName{appstate.WAPatchCriticalUnblockLow, appstate.WAPatchRegularHigh, appstate.WAPatchRegular, appstate.WAPatchRegularLow, appstate.WAPatchCriticalBlock} {
		_ = cli.FetchAppState(ctx, ad, tam, false)
	}
}

func bagla(id int) {
	qrKilit.Lock()
	defer qrKilit.Unlock()
	if cli.Store.ID != nil {
		if !cli.IsConnected() {
			if err := cli.Connect(); err != nil {
				cevap(id, nil, err)
				return
			}
		}
		cevap(id, durum(), nil)
		return
	}
	if qrIptal != nil {
		qrIptal()
	}
	cli.Disconnect()
	qctx, iptal := context.WithCancel(ctx)
	qrIptal = iptal
	kanal, err := cli.GetQRChannel(qctx)
	if err != nil {
		cevap(id, nil, err)
		return
	}
	if err := cli.Connect(); err != nil {
		cevap(id, nil, err)
		return
	}
	cevap(id, nil, nil)
	go func() {
		for e := range kanal {
			switch e.Event {
			case "code":
				yolla(map[string]any{"ev": "qr", "kod": e.Code, "sure": int(e.Timeout / time.Second)})
			case "success":
				yolla(map[string]any{"ev": "qr_tamam"})
				yolla(durum())
			default:
				yolla(map[string]any{"ev": "qr_bitti", "neden": e.Event})
			}
		}
	}()
}

func ara(q string) ([]hedef, error) {
	if cli.Store.ID == nil {
		return nil, errors.New("WhatsApp bağlı değil")
	}
	q = kucuk.String(strings.TrimSpace(q))
	var out []hedef
	if gruplar, err := cli.GetJoinedGroups(ctx); err == nil {
		for _, g := range gruplar {
			if g.Name == "" {
				continue
			}
			if q == "" || strings.Contains(kucuk.String(g.Name), q) {
				out = append(out, hedef{JID: g.JID.String(), Ad: g.Name, Tur: "grup", Alt: fmt.Sprintf("%d kişi", len(g.Participants))})
			}
		}
	}
	kisiler, err := cli.Store.Contacts.GetAllContacts(ctx)
	if err == nil {
		for jid, k := range kisiler {
			if jid.Server != types.DefaultUserServer {
				continue
			}
			ad := k.FullName
			if ad == "" {
				ad = k.FirstName
			}
			if ad == "" {
				ad = k.PushName
			}
			if ad == "" {
				ad = k.BusinessName
			}
			if ad == "" {
				continue
			}
			if q == "" || strings.Contains(kucuk.String(ad), q) || strings.Contains(jid.User, strings.TrimPrefix(q, "+")) {
				out = append(out, hedef{JID: jid.String(), Ad: ad, Tur: "kisi", Alt: "+" + jid.User})
			}
		}
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].Tur != out[j].Tur {
			return out[i].Tur == "grup"
		}
		return kucuk.String(out[i].Ad) < kucuk.String(out[j].Ad)
	})
	if len(out) > 40 {
		out = out[:40]
	}
	return out, nil
}

func onizleme(img image.Image) []byte {
	b := img.Bounds()
	en := 96
	boy := b.Dy() * en / b.Dx()
	if boy < 1 {
		boy = 1
	}
	k := image.NewRGBA(image.Rect(0, 0, en, boy))
	for y := 0; y < boy; y++ {
		for x := 0; x < en; x++ {
			x0, x1 := b.Min.X+x*b.Dx()/en, b.Min.X+(x+1)*b.Dx()/en
			y0, y1 := b.Min.Y+y*b.Dy()/boy, b.Min.Y+(y+1)*b.Dy()/boy
			var r, g, bb, n uint64
			adim := max(1, (x1-x0)/8)
			for yy := y0; yy < y1; yy += adim {
				for xx := x0; xx < x1; xx += adim {
					cr, cg, cb, _ := img.At(xx, yy).RGBA()
					r, g, bb, n = r+uint64(cr), g+uint64(cg), bb+uint64(cb), n+1
				}
			}
			if n == 0 {
				n = 1
			}
			i := k.PixOffset(x, y)
			k.Pix[i], k.Pix[i+1], k.Pix[i+2], k.Pix[i+3] = uint8(r/n>>8), uint8(g/n>>8), uint8(bb/n>>8), 255
		}
	}
	var w bytes.Buffer
	_ = jpeg.Encode(&w, k, &jpeg.Options{Quality: 70})
	return w.Bytes()
}

func gonder(jidMetin string, dosyalar []string) error {
	if cli.Store.ID == nil {
		return errors.New("WhatsApp bağlı değil")
	}
	defer func() {
		for _, yol := range dosyalar {
			_ = os.Remove(yol)
		}
	}()
	jid, err := types.ParseJID(jidMetin)
	if err != nil {
		return err
	}
	if !cli.IsConnected() {
		if err := cli.Connect(); err != nil {
			return err
		}
	}
	for i := 0; i < 20 && !cli.IsLoggedIn(); i++ {
		time.Sleep(250 * time.Millisecond)
	}
	for _, yol := range dosyalar {
		veri, err := os.ReadFile(yol)
		if err != nil {
			return err
		}
		img, _, err := image.Decode(bytes.NewReader(veri))
		if err != nil {
			return fmt.Errorf("resim okunamadı: %w", err)
		}
		up, err := cli.Upload(ctx, veri, whatsmeow.MediaImage)
		if err != nil {
			return fmt.Errorf("yüklenemedi: %w", err)
		}
		en, boy := uint32(img.Bounds().Dx()), uint32(img.Bounds().Dy())
		msg := &waE2E.Message{ImageMessage: &waE2E.ImageMessage{
			Mimetype:      proto.String("image/png"),
			URL:           &up.URL,
			DirectPath:    &up.DirectPath,
			MediaKey:      up.MediaKey,
			FileEncSHA256: up.FileEncSHA256,
			FileSHA256:    up.FileSHA256,
			FileLength:    &up.FileLength,
			Width:         &en,
			Height:        &boy,
			JPEGThumbnail: onizleme(img),
		}}
		if _, err := cli.SendMessage(ctx, jid, msg); err != nil {
			return fmt.Errorf("gönderilemedi: %w", err)
		}
	}
	return nil
}

func isle(r istek) {
	switch r.Op {
	case "durum":
		cevap(r.ID, durum(), nil)
	case "bagla":
		bagla(r.ID)
	case "iptal":
		qrKilit.Lock()
		if qrIptal != nil {
			qrIptal()
			qrIptal = nil
		}
		if cli.Store.ID == nil {
			cli.Disconnect()
		}
		qrKilit.Unlock()
		cevap(r.ID, nil, nil)
	case "ara":
		v, err := ara(r.Q)
		cevap(r.ID, v, err)
	case "rehber":
		rehberCek(true)
		cevap(r.ID, nil, nil)
	case "gonder":
		cevap(r.ID, nil, gonder(r.JID, r.Dosyalar))
	case "cikis":
		var err error
		if cli.Store.ID != nil {
			if cli.IsConnected() {
				err = cli.Logout(ctx)
			}
			if err != nil || cli.Store.ID != nil {
				err = cli.Store.Delete(ctx)
			}
		}
		yeniCihaz()
		yolla(durum())
		cevap(r.ID, nil, err)
	default:
		cevap(r.ID, nil, fmt.Errorf("bilinmeyen istek: %s", r.Op))
	}
}

func main() {
	veri := flag.String("veri", ".", "")
	flag.Parse()
	_ = os.MkdirAll(*veri, 0o700)
	db := "file:" + filepath.ToSlash(filepath.Join(*veri, "oturum.db")) + "?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)"
	var err error
	kap, err = sqlstore.New(ctx, "sqlite", db, waLog.Noop)
	if err != nil {
		yolla(map[string]any{"ev": "hata", "hata": err.Error()})
		os.Exit(1)
	}
	dev, err := kap.GetFirstDevice(ctx)
	if err != nil {
		yolla(map[string]any{"ev": "hata", "hata": err.Error()})
		os.Exit(1)
	}
	cli = whatsmeow.NewClient(dev, waLog.Noop)
	cli.AddEventHandler(olay)
	yolla(durum())
	if cli.Store.ID != nil {
		go func() {
			if err := cli.Connect(); err != nil {
				yolla(map[string]any{"ev": "hata", "hata": err.Error()})
			}
		}()
	}
	oku := bufio.NewScanner(os.Stdin)
	oku.Buffer(make([]byte, 1<<16), 1<<20)
	var bekle sync.WaitGroup
	for oku.Scan() {
		var r istek
		if json.Unmarshal(oku.Bytes(), &r) != nil {
			continue
		}
		bekle.Add(1)
		go func() {
			defer bekle.Done()
			isle(r)
		}()
	}
	bekle.Wait()
	cli.Disconnect()
}
