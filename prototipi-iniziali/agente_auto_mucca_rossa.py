from playwright.sync_api import sync_playwright
import time
import os
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav

COURSE_URL = "https://corsi.bizacademy.net/products/mooney-automation-platinum"
BASE_FILTER = "/products/mooney-automation-platinum/categories/2155199093/posts/"

SAMPLE_RATE = 44100


def clean_name(name):
    return (
        name.strip()
        .replace(" ", "_")
        .replace("/", "-")
        .replace(":", "-")
        .replace("?", "")
        .replace("*", "")
        .replace('"', "")
        .replace("'", "")
    )


course_name = clean_name(input("📚 Nome corso: "))
base_course_path = os.path.join("StudyCoursesAgent", course_name)
os.makedirs(base_course_path, exist_ok=True)


def wait_for_login(page):
    page.goto(COURSE_URL)
    time.sleep(4)

    print("\n🔐 Se serve, fai login nel browser.")
    input("Quando sei dentro al corso, premi ENTER...")


def open_course(page):
    page.goto(COURSE_URL)
    time.sleep(5)

    try:
        page.locator("text=Continua il Corso").click(timeout=5000)
        time.sleep(5)
    except:
        pass


def get_lessons(page):
    links = page.locator("a").all()
    lessons = []

    for el in links:
        try:
            href = el.get_attribute("href") or ""
            text = el.inner_text().strip()

            if BASE_FILTER in href and len(text) > 5:
                if any(x in text.lower() for x in [
                    "indietro", "prossimo", "completato", "categoria"
                ]):
                    continue

                lessons.append({
                    "title": text,
                    "href": href
                })
        except:
            pass

    # rimuove duplicati
    unique = []
    seen = set()

    for l in lessons:
        if l["href"] not in seen:
            seen.add(l["href"])
            unique.append(l)

    return unique


def record_until_end(page, lesson_name, base_path):
    print(f"🎬 Registrazione: {lesson_name}")

    recording = []
    last_time = -1
    stuck = 0

    def callback(indata, frames, time_info, status):
        recording.append(indata.copy())

    stream = sd.InputStream(samplerate=SAMPLE_RATE, channels=1, callback=callback)
    stream.start()

    while True:
        data = page.evaluate("""
            () => {
                const v = document.querySelector('video');
                if (!v) return null;

                if (v.paused && !v.ended) v.play();

                return {
                    current: v.currentTime,
                    duration: v.duration,
                    ended: v.ended,
                    paused: v.paused
                };
            }
        """)

        if data:
            current = data["current"]
            duration = data["duration"]
            ended = data["ended"]

            print(f"{int(current)} / {int(duration)} sec", end="\r")

            if abs(current - last_time) < 0.5:
                stuck += 1
            else:
                stuck = 0

            last_time = current

            if stuck >= 5:
                page.evaluate("document.querySelector('video').play()")
                stuck = 0

            if ended or current >= duration - 2:
                print("\n✅ Video finito")
                break

        time.sleep(2)

    stream.stop()
    stream.close()

    audio = np.concatenate(recording, axis=0)
    max_val = np.max(np.abs(audio))

    if max_val > 0:
        audio = np.int16(audio / max_val * 32767)
    else:
        audio = np.int16(audio)

    path = os.path.join(base_path, f"{lesson_name}.wav")
    wav.write(path, SAMPLE_RATE, audio)

    print(f"💾 Salvato: {path}")


with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(
        user_data_dir="mucca_rossa_session",
        headless=False
    )

    page = browser.new_page()

    wait_for_login(page)
    open_course(page)

    lessons = get_lessons(page)

    print(f"\n📚 Trovate {len(lessons)} lezioni REALI")

    if len(lessons) == 0:
        print("❌ Nessuna lezione trovata")
        browser.close()
        exit()

    for i, lesson in enumerate(lessons, start=1):
        try:
            title = clean_name(f"{i:03d}_{lesson['title']}")
            print(f"\n🚀 {title}")

            base_path = os.path.join(base_course_path, title)
            os.makedirs(base_path, exist_ok=True)

            url = "https://corsi.bizacademy.net" + lesson["href"]
            page.goto(url)
            time.sleep(5)

            page.evaluate("""
                () => {
                    const v = document.querySelector('video');
                    if (v) {
                        v.currentTime = 0;
                        v.play();
                    }
                }
            """)

            record_until_end(page, title, base_path)

            print(f"✅ COMPLETATA: {title}")

        except Exception as e:
            print(f"❌ Errore: {e}")
            continue

    browser.close()
    print("\n🎉 FINITO TUTTO")