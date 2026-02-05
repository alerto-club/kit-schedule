<div align="center">
<img src="[https://capsule-render.vercel.app/api?type=waving&color=0D1117&height=200&section=header&text=KIT%20Schedule%20PWA&fontSize=50&animation=fadeIn&fontColor=ffffff](https://capsule-render.vercel.app/api?type=waving&color=0D1117&height=200&section=header&text=KIT%20Schedule%20PWA&fontSize=50&animation=fadeIn&fontColor=ffffff)" alt="Header" />

<p align="center">
<strong>Современное веб-приложение (PWA) для просмотра расписания с полноценной поддержкой оффлайн-режима.</strong>
</p>

<img src="[https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)" alt="HTML5">
<img src="[https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)" alt="CSS3">
<img src="[https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)" alt="JavaScript">
<img src="[https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)" alt="PWA">
<img src="[https://img.shields.io/badge/JSON-Data-000000?style=for-the-badge&logo=json&logoColor=white](https://img.shields.io/badge/JSON-Data-000000?style=for-the-badge&logo=json&logoColor=white)" alt="JSON">
</div>

---

### 🎯 Обзор проекта

**KIT Schedule** — это легковесное клиентское приложение (SPA), предназначенное для быстрого доступа к расписанию занятий. Благодаря технологии **Progressive Web App (PWA)**, приложение работает в браузере как полноценная программа: его можно установить на рабочий стол или экран телефона, и оно продолжит работать даже без доступа к интернету.

Проект ориентирован на учебные заведения (например, КАИ) и позволяет динамически переключаться между расписанием групп, преподавателей и аудиторий.

---

### 🏗 Архитектура системы

В проекте реализована логика **Offline-First**. Service Worker перехватывает запросы и отдает закэшированные ресурсы, если сеть недоступна:

```mermaid
graph TD
    User((Пользователь)) -->|Открывает| UI[Интерфейс PWA]
    UI <-->|Запрос ресурсов| SW[Service Worker (sw.js)]

    subgraph "Уровень данных"
    SW <-->|Кэширование| Cache[Local Cache Storage]
    SW -.->|Обновление| Server((Web Server))
    end
    
    UI -->|Парсинг| JS[script.js]
    JS -->|Загрузка| Data[schedule.json]
    Data -->|Рендер| DOM[HTML Generation]

```

---

### 🔥 Ключевые возможности

* **Offline-First & PWA:**
* **Installable:** Установка на iOS, Android и Desktop через браузер.
* **Service Worker:** Мгновенная загрузка оболочки и работа в режиме полета.


* **Гибкое управление данными:**
* **Three View Modes:** Просмотр расписания для Студентов, Преподавателей и Аудиторий.
* **Dual Calendar:** Переключение между отображением "По неделям" (статичное) и "По датам" (календарный вид).
* **Week Toggle:** Поддержка четных и нечетных недель.


* **Умный UX:**
* **Search & Track:** Быстрый поиск по базе и сохранение выбранных групп/преподавателей в "Избранное" (LocalStorage).
* **Swipe Navigation:** Листание дней недели с помощью жестов (свайпов).
* **Dark Theme:** Современный темный интерфейс с акцентными цветами для разных типов занятий (Лекции, Лабораторные, Практики).



---

### 🛠 Технический стек

* **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Modern Flexbox/Grid).
* **PWA Features:** Web App Manifest (`manifest.json`), Service Workers API.
* **Data Source:** Локальный JSON-файл с поддержкой сложной структуры занятий.
* **Styling:** Кастомные CSS-переменные для легкой смены тем оформления.

---

### 🚀 Быстрый запуск

#### 1. Предварительная настройка

Клонируйте репозиторий. Настройте файл `schedule.json`, заполнив его данными в следующем формате:

```json
{
  "groups": {
    "4434": [
      {
        "dayId": 0,
        "lessons": [
          { "time": "08:00 - 09:30", "subject": "Математика", "type": "ЛЕК", "room": "401", "teacher": "Иванов И.И.", "dates": "все" }
        ]
      }
    ]
  },
  "teachers": {},
  "rooms": {}
}

```

#### 2. Запуск приложения

Для работы PWA и Service Worker требуется **HTTPS** или **localhost**. Используйте любой локальный сервер:

* **Python:** `python3 -m http.server 8000`
* **Node.js:** `npx http-server .`
* **VS Code:** Расширение *Live Server*.

#### 3. Установка

1. Откройте `http://localhost:8000` в браузере (рекомендуется Chrome или Safari).
2. Нажмите на иконку «Добавить на главный экран» в адресной строке или меню браузера.
3. Теперь приложение доступно в списке ваших программ и работает оффлайн!

---

<div align="center">
<sub>Built with ❤️ by Alerto</sub>
</div>
