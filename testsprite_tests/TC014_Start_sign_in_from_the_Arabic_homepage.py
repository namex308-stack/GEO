import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Click the primary hero Call-to-Action button labeled "حلّل متجري" to start the sign-in flow.
        # حلّل متجري button
        elem = page.get_by_text('اعرف ما يضر مبيعاتي', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='حلّل متجري', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the sign-in page by clicking the top navigation link labeled "تسجيل الدخول".
        # تسجيل الدخول button
        elem = page.locator('xpath=/html/body/div[2]/header/nav/div[2]/button')
        await elem.click(timeout=10000)
        
        # -> Click the main call-to-action button labeled 'حلّل متجري' (Analyze my store) to start the sign-in flow and then verify the sign-in UI appears.
        # حلّل متجري button
        elem = page.get_by_text('اعرف ما يضر مبيعاتي', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='حلّل متجري', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the Arabic landing page content is displayed
        # Assert: Expected the header brand link to contain the Arabic label 'الصفحة الرئيسية'.
        await expect(page.locator("xpath=/html/body/div[2]/header/nav/a").nth(0)).to_contain_text("\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629", timeout=15000), "Expected the header brand link to contain the Arabic label '\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629'."
        # Assert: Expected the primary hero CTA to include the Arabic start action 'ابدأ الآن'.
        await expect(page.locator("xpath=/html/body/div[2]/main/section[1]/div[2]/div[4]/div/button[1]").nth(0)).to_contain_text("\u0627\u0628\u062f\u0623 \u0627\u0644\u0622\u0646", timeout=15000), "Expected the primary hero CTA to include the Arabic start action '\u0627\u0628\u062f\u0623 \u0627\u0644\u0622\u0646'."
        
        # --> Verify the sign-in page is opened
        # Assert: Expected URL to contain '/login' indicating the sign-in page was opened.
        await expect(page).to_have_url(re.compile("/login"), timeout=15000), "Expected URL to contain '/login' indicating the sign-in page was opened."
        # Assert: Expected URL to contain '/signin' indicating the sign-in page was opened.
        await expect(page).to_have_url(re.compile("/signin"), timeout=15000), "Expected URL to contain '/signin' indicating the sign-in page was opened."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    