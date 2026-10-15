<<<<<<< HEAD
# Extension_Star_Brave

Animated starfield new tab for Brave and Chrome (Manifest V3).

Animation pauses while the tab is hidden and resumes from its previous animation
time when visible again. Background tabs do not schedule drawing frames.

## Install

Open `brave://extensions` (or `chrome://extensions`), enable Developer mode,
choose **Load unpacked**, and select this folder. After updating, reload the
extension and open a new tab. Google suggestions require permission for
`https://suggestqueries.google.com/*`.

## Search

- Enter a domain or HTTP/HTTPS URL to visit it, or enter text to search Google.
- Press the physical `/` key outside an editable field to focus search,
  including `ฝ` on the Thai keyboard layout. Esc closes the list in either layout.
- The last 10 entries are stored locally. Remove individual entries with ×,
  or choose **Clear all**. This is separate from browser history.
- Google suggestions appear after at least two characters (250 ms debounce).
  Typed text is sent to Google; cookies are omitted. If the service is unavailable,
  local history matches remain available and normal search still works.
- Use ↑/↓ and Enter to select suggestions, or click one. Esc closes the list.

## Verify

Run `node --test` for URL routing and history tests. For a browser check, reload
the extension and try a domain, a Thai query, history deletion, `/`, arrow keys,
Esc, and suggestions with the network offline. Google suggestions use a public
endpoint whose availability can change.
=======
# Highlight Translate to Thai

ส่วนขยายเบราว์เซอร์สำหรับ Brave และ Chrome — ไฮไลต์ข้อความในหน้าเว็บไหนก็ได้ แล้วคำแปลภาษาไทยจะเด้งขึ้นมาข้าง ๆ ทันที ไม่ต้องกดปุ่ม ไม่ต้องเปิดแท็บใหม่

ตรวจจับภาษาต้นทางอัตโนมัติ และข้ามให้เองถ้าข้อความที่ไฮไลต์เป็นภาษาไทยอยู่แล้ว

## ติดตั้ง

ยังไม่ได้ขึ้น Web Store — ติดตั้งแบบ unpacked

1. เปิด `brave://extensions` (หรือ `chrome://extensions`)
2. เปิด **Developer mode** ที่มุมขวาบน
3. กด **Load unpacked** แล้วเลือกโฟลเดอร์นี้
4. เปิดหน้าเว็บภาษาอังกฤษ ไฮไลต์สักประโยค

> หลังแก้โค้ดแล้วต้องกด reload ที่ตัวส่วนขยาย **และ** refresh หน้าเว็บที่เปิดค้างไว้ด้วย เพราะ content script ถูกฉีดเข้าไปตอนโหลดหน้าครั้งเดียว แท็บที่เปิดอยู่ก่อนจะยังรันโค้ดเวอร์ชันเก่าต่อไป

## วิธีใช้

| ทำอะไร | ผลลัพธ์ |
|---|---|
| ไฮไลต์ข้อความ | popup คำแปลไทยขึ้นใต้ข้อความ |
| ไฮไลต์ข้อความไทย | ไม่มี popup (ไม่มีอะไรต้องแปล) |
| คลิกที่อื่น / กด `Esc` / เลื่อนหน้า | popup ปิด |

ข้อความยาวเกิน 3,000 ตัวอักษรจะถูกข้าม เพื่อไม่ให้ยิงคำขอใหญ่เกินจำเป็น

## โครงสร้าง

```
manifest.json    ตั้งค่า Manifest V3
background.js    service worker — เรียก endpoint แปลภาษา
content.js       จับ selection, จัดตำแหน่งและวาด popup
content.css      สไตล์ popup (design token, โหมดมืด)
fonts/           Kanit น้ำหนัก 400/500 (ไทย + ละติน, ~40 KB)
```

การไหลของข้อมูล: `mouseup` → อ่าน selection → ส่ง message ไป service worker → fetch คำแปล → วาด popup ใต้ selection

การ fetch อยู่ใน service worker ไม่ใช่ใน content script เพราะยิงจากบริบทของหน้าเว็บจะติด CORS

## รายละเอียดที่ควรรู้

**บริการแปล** ใช้ endpoint สาธารณะของ Google (`translate.googleapis.com/translate_a/single?client=gtx`) ไม่ต้องใช้ API key และไม่มีค่าใช้จ่าย แต่ไม่ใช่ API ที่เป็นทางการ — อาจโดนจำกัดถ้ายิงถี่มาก และอาจเปลี่ยนรูปแบบ response ได้โดยไม่แจ้งล่วงหน้า ถ้าต้องการความเสถียรระดับ production ให้เปลี่ยนไปใช้ Google Cloud Translation API

**สิทธิ์และความเป็นส่วนตัว** ส่วนขยายฉีด content script เข้าไปในทุกหน้าเว็บ (`matches: <all_urls>`) เพราะจำเป็นต้องดักการไฮไลต์ข้อความ ตอนติดตั้งเบราว์เซอร์จึงเตือนว่า "อ่านและเปลี่ยนแปลงข้อมูลของคุณในทุกเว็บไซต์" ซึ่งถูกต้อง — script ตัวนี้อ่าน DOM ของหน้าที่คุณเปิดได้จริง

ส่วนสิทธิ์เชื่อมต่อเครือข่าย (`host_permissions`) จำกัดไว้ที่ `https://translate.googleapis.com/*` อย่างเดียว ข้อมูลเดียวที่ถูกส่งออกไปข้างนอกคือข้อความที่คุณไฮไลต์ ส่งไปยัง Google เพื่อแปล ไม่มีการเก็บลงเครื่อง ไม่มี analytics และไม่ส่งไปที่อื่น

**ฟอนต์** Kanit ถูก bundle มาในตัว ไม่ได้โหลดจาก Google Fonts ตอนใช้งาน — หน้าเว็บที่คุณเปิดจึงไม่มีการยิงคำขอออกไปข้างนอกเพิ่ม

**การแยกสไตล์** popup ตั้ง `all: initial` แล้วประกาศสไตล์ใหม่ทั้งหมด เพื่อกันไม่ให้ CSS ของหน้าเว็บเจ้าของบ้านรั่วเข้ามา ถ้าเจอเว็บที่ยังแทรกสไตล์เข้ามาได้ (กฎที่ specificity สูงกว่า) ทางแก้คือย้ายไปใช้ Shadow DOM

**โหมดมืด** popup เปลี่ยนสีตามธีมของระบบผ่าน `prefers-color-scheme` ไม่ได้ดูจากสีของหน้าเว็บ

**หลัง reload ส่วนขยาย** content script ที่ค้างอยู่ในแท็บเก่าจะติดต่อกับส่วนขยายไม่ได้อีก มันจะตรวจเจอเองแล้วถอด event listener ทั้งหมดออกเงียบ ๆ แทนที่จะโยน error ทุกครั้งที่ไฮไลต์ — แต่แท็บนั้นจะใช้งานไม่ได้จนกว่าจะ refresh

## ปรับแต่ง

| อยากเปลี่ยน | แก้ที่ |
|---|---|
| ภาษาปลายทาง | `tl=th` ใน `background.js` |
| ขนาด/สีของ popup | ตัวแปร `--tlx-*` ที่ต้น `.__tlx-popup` ใน `content.css` |
| ความยาวสูงสุดที่ยอมแปล | `MAX_LENGTH` ใน `content.js` |
| หน่วงเวลาก่อนแปล | `DEBOUNCE_MS` ใน `content.js` |
>>>>>>> 7a256c25b3b736929b81771e6305f1bac2ffe733
