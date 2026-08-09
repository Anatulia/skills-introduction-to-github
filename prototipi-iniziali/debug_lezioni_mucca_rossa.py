from playwright.sync_api import sync_playwright
import time

COURSE_URL = "https://corsi.bizacademy.net/products/mooney-automation-platinum"

with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(
        user_data_dir="mucca_rossa_session",
        headless=False
    )

    page = browser.new_page()
    page.goto(COURSE_URL)
    time.sleep(5)

    try:
        page.locator("text=Continua il Corso").click(timeout=7000)
        time.sleep(5)
    except:
        pass

    print("\n=== LINK TROVATI ===\n")

    links = page.locator("a").all()

    for i, link in enumerate(links):
        try:
            txt = link.inner_text().strip().replace("\n", " | ")
            href = link.get_attribute("href")
            if txt or href:
                print(f"{i}: TEXT=[{txt}] HREF=[{href}]")
        except:
            pass

    input("\nPremi ENTER per chiudere...")
    browser.close()
