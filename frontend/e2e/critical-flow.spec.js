// @ts-check
import { test, expect } from '@playwright/test'

const mockUser = {
  id: 1,
  email: 'e2e@test.com',
  firstName: 'E2E',
  lastName: 'User',
  role: 'user',
}

test.describe('Критичный флоу: логин и создание запроса', () => {
  test('логин → создание запроса о помощи → редирект на карту', async ({ page }) => {
    // Мокаем API: логин и создание запроса
    await page.route('**/api/auth/login/**', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'OK',
          user: mockUser,
          token: 'mock-jwt-token',
        }),
      })
    })
    await page.route('**/api/auth/me/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: mockUser }),
      })
    })
    await page.route('**/api/requests/**', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Запрос создан', request: { id: 1 } }),
      })
    })

    // 1. Логин (форма входа — только она видна на /login)
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /вход в систему/i })).toBeVisible()

    await page.locator('#login-email').fill('e2e@test.com')
    await page.locator('#login-password').fill('Password1!')
    await page.getByRole('button', { name: /войти/i }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    // 2. Переход к созданию запроса
    await page.goto('/create-request')
    await expect(page.getByRole('heading', { name: /создать запрос о помощи/i })).toBeVisible()

    // Шаг 1: тип помощи (карточка с текстом «Медицинская помощь»)
    await page.getByRole('radio', { name: /медицинская помощь/i }).first().check()
    await page.getByRole('button', { name: 'Далее' }).click()

    // Шаг 2: детали
    await page.locator('#address').fill('г. Алматы, ул. Абая, 150')
    await page.locator('#description').fill('Нужна вода и медикаменты для 3 человек.')
    await page.getByRole('button', { name: 'Далее' }).click()

    // Шаг 3: контакты и отправка
    await page.locator('#contactName').fill('Иван Иванов')
    await page.locator('#contactPhone').fill('+7 777 123 45 67')
    await page.getByRole('checkbox', { name: /согласен на обработку/i }).check()
    await page.getByRole('button', { name: /отправить запрос/i }).click()

    // Ожидаем редирект на карту
    await expect(page).toHaveURL(/\/map/, { timeout: 10000 })
  })
})
