# LIFEOS — MASTER INSTRUCTION FOR CLAUDE CODE

## 1. ROLA

Jesteś głównym inżynierem oprogramowania, architektem systemu, product designerem i developerem odpowiedzialnym za stworzenie wysokiej jakości aplikacji webowej typu **Life Management / Personal Operating System**.

Projekt roboczy nazywa się:

**LifeOS**

Aplikacja ma służyć do zarządzania możliwie dużą częścią życia użytkownika w jednym miejscu:

- finanse osobiste,
- budżet,
- planowanie dnia,
- zadania,
- projekty,
- kalendarz,
- cele,
- nawyki,
- rutyny,
- treningi,
- aktywność,
- postęp,
- notatki,
- dziennik,
- zakupy,
- ważne terminy,
- przeglądy tygodniowe i miesięczne,
- statystyki,
- analityka życia,
- przypomnienia,
- automatyzacje,
- w przyszłości również AI.

Najważniejszym celem nie jest stworzenie kolejnego prostego to-do list app.

Celem jest stworzenie **jednego centralnego systemu zarządzania życiem**, który daje użytkownikowi odpowiedź na pytania:

> Co mam dziś zrobić?  
> Na czym powinienem się skupić?  
> Jak wygląda moja sytuacja finansowa?  
> Czy realizuję swoje cele?  
> Jak radzę sobie z nawykami?  
> Czy regularnie trenuję?  
> Jak rozwija się moje życie w czasie?  
> Co zaniedbuję?  
> Co powinienem zrobić następnie?

Aplikacja ma być bardzo prosta w codziennym użyciu mimo dużej liczby funkcji.

---

# 2. NAJWAŻNIEJSZA ZASADA

**Nie buduj aplikacji jako zbioru niezależnych modułów.**

Wszystkie moduły powinny być ze sobą logicznie połączone.

Przykład:

Cel:
„Oszczędzić 20 000 PLN”

może być połączony z:

- kontem oszczędnościowym,
- budżetem,
- transakcjami,
- zadaniami,
- nawykiem,
- miesięcznym targetem,
- dashboardem,
- wykresem postępu.

Podobnie:

Cel:
„Przebiec półmaraton”

może być połączony z:

- planem treningowym,
- treningami,
- aktywnością,
- tygodniowym planem,
- zadaniami,
- postępem.

System ma tworzyć **sieć zależności pomiędzy elementami życia użytkownika**, a nie izolowane miniaplikacje.

---

# 3. PRODUCT VISION

LifeOS ma być połączeniem:

- Notion,
- Todoist,
- Google Calendar,
- YNAB,
- Habitica,
- aplikacji treningowej,
- osobistego dashboardu,
- prostego systemu goal tracking.

Jednocześnie aplikacja NIE może być skomplikowana jak ERP.

Najważniejsza zasada UX:

**„Minimum wysiłku użytkownika, maksimum informacji zwrotnej.”**

Użytkownik powinien móc:

- dodać zadanie w kilka sekund,
- oznaczyć nawyk jednym kliknięciem,
- dodać wydatek bardzo szybko,
- rozpocząć trening bez przeklikiwania wielu ekranów,
- zobaczyć najważniejsze informacje z całego życia na jednym dashboardzie.

---

# 4. STACK TECHNOLOGICZNY

Użyj nowoczesnego, stabilnego stacku.

Preferowany:

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

### Backend
- Next.js server actions / API routes tam, gdzie mają sens
- Supabase

### Database
- PostgreSQL

### Authentication
- Supabase Auth

Obsługuj co najmniej:
- email + password,
- magic link,
- OAuth jako przygotowaną możliwość rozbudowy.

### Forms / validation
- React Hook Form
- Zod

### Data fetching / caching
- TanStack Query lub natywne rozwiązanie Next.js — wybierz rozwiązanie najbardziej odpowiednie dla architektury.

### State
- Zustand tylko dla rzeczy wymagających globalnego client state.
- Nie używaj globalnego state bez potrzeby.

### Charts
- Recharts lub biblioteka kompatybilna z resztą projektu.

### Dates
- date-fns.

### Icons
- Lucide.

### PWA
Aplikacja powinna być przygotowana jako Progressive Web App.

### Quality
- ESLint
- Prettier
- TypeScript strict mode
- testy jednostkowe
- testy komponentów
- testy end-to-end

Preferowane narzędzia:
- Vitest
- Testing Library
- Playwright

---

# 5. DESIGN SYSTEM

Interfejs ma wyglądać jak nowoczesny produkt premium.

Inspiracja:

- Linear
- Apple
- Notion
- Arc
- modern fintech dashboards

Nie kopiuj ich bezpośrednio.

## Design principles

### 1. Minimalizm

Unikaj:
- przeładowanych dashboardów,
- nadmiernej liczby kart,
- grubych obramowań,
- niepotrzebnych gradientów,
- 20 przycisków na ekranie.

### 2. Hierarchia informacji

Każdy ekran powinien posiadać:

1. jasny tytuł,
2. krótki kontekst,
3. główną informację,
4. najważniejsze działania,
5. szczegóły dopiero niżej.

### 3. Density

Aplikacja desktopowa może być stosunkowo gęsta informacyjnie.

Mobile powinien być uproszczony.

### 4. Kolory

Bazowo:

- neutralne tło,
- biały / lekko szary content,
- jeden kolor akcentowy,
- kolory statusów,
- czerwony dla problemów,
- zielony dla pozytywnych wyników,
- żółty dla ostrzeżeń.

Nie stosuj nadmiaru kolorów.

### 5. Typography

Czytelna nowoczesna typografia.

Duże znaczenie dla:

- liczb,
- KPI,
- nazw celów,
- terminów,
- statusów.

---

# 6. GŁÓWNA NAWIGACJA

Desktop:

```text
LifeOS

Dashboard

Today
Tasks
Calendar
Projects

Goals

Habits
Routines

Finances

Workouts
Activity

Notes
Journal

Analytics

More
  Shopping
  Reviews
  Settings
```

Mobile:

Dolna nawigacja:

```text
Home
Today
Add
Calendar
More
```

Przycisk `Add` ma otwierać szybkie menu:

```text
Task
Expense
Habit
Workout
Note
Event
Goal
```

---

# 7. DASHBOARD

Dashboard jest najważniejszym ekranem aplikacji.

Powinien odpowiadać na pytanie:

**„Jak wygląda moje życie teraz?”**

## Sekcje

### Header

```text
Good morning, [User Name]

[Date]

How is your life going today?
```

Nie zakładaj konkretnego imienia w produkcie — dane użytkownika mają pochodzić z profilu.

### Today overview

Pokazuj:

- zadania,
- wydarzenia,
- trening,
- nawyki,
- przypomnienia.

### Financial snapshot

Na przykład:

```text
Net worth
128 420 PLN

This month
Income       10 450 PLN
Expenses      6 230 PLN
Savings       4 220 PLN
```

### Habit progress

```text
6 / 8 habits completed
75%
```

### Goals

```text
Save 20 000 PLN
████████████░░ 78%

Run half marathon
███████░░░░░░ 54%
```

### Training

```text
This week
3 / 4 workouts

8 423 steps today
```

### Focus

Użytkownik może określić:

```text
Today's focus
"Finish project presentation"
```

### Quick actions

```text
+ Task
+ Expense
+ Workout
+ Habit
+ Note
```

Dashboard powinien być konfigurowalny.

Użytkownik może:
- zmieniać kolejność widgetów,
- ukrywać widgety,
- dodawać widgety,
- zmieniać zakres danych.

---

# 8. TODAY

To powinien być najbardziej użyteczny ekran codziennego użytkowania.

Widok:

```text
TODAY

08:00
Morning routine

09:00
Work

12:30
Lunch

13:00
Task: Prepare report

17:30
Gym

20:00
Read 30 min
```

Integruj tutaj:

- kalendarz,
- taski,
- nawyki,
- rutyny,
- trening,
- ważne przypomnienia.

Dodaj widoki:

- Timeline,
- List,
- Focus.

---

# 9. TASK MANAGEMENT

System zadań powinien wspierać:

- Inbox,
- Today,
- Upcoming,
- Scheduled,
- Someday,
- Completed.

Każde zadanie:

```text
title
description
status
priority
due_date
due_time
duration
repeat
project
goal
tags
parent_task
created_at
completed_at
```

Priorytety:

```text
P1
P2
P3
P4
```

Status:

```text
Inbox
Todo
In Progress
Completed
Cancelled
```

Obsługuj:

- subtasks,
- recurring tasks,
- dependencies,
- reminders,
- attachments,
- notes.

Dodaj Quick Add.

Przykład:

```text
Buy groceries tomorrow at 18:00
```

System powinien być przygotowany pod przyszły natural-language parser.

---

# 10. PROJECTS

Projekt to zbiór powiązanych zadań prowadzących do rezultatu.

Przykład:

```text
Project:
Move to Berlin

Tasks:
- Find apartment
- Compare neighborhoods
- Prepare documents
- Book transport
- Cancel current rental
```

Projekt posiada:

- nazwę,
- opis,
- status,
- deadline,
- priority,
- owner,
- progress,
- linked goal.

Status:

```text
Planning
Active
On Hold
Completed
Archived
```

---

# 11. GOALS

Goals są jednym z centralnych elementów aplikacji.

Przykład:

```text
Goal:
Build emergency fund

Target:
30 000 PLN

Current:
18 500 PLN

Progress:
61.7%

Deadline:
31.12.2026
```

Goal może mieć:

- target numeric,
- target boolean,
- target percentage,
- target date,
- milestones,
- linked projects,
- linked tasks,
- linked habits,
- linked financial accounts,
- notes.

Kategorie:

```text
Finance
Career
Learning
Health
Fitness
Relationships
Travel
Lifestyle
Personal
```

### Goal dashboard

Pokazuj:

- current value,
- target,
- progress,
- pace,
- expected completion,
- milestones,
- recent activity.

---

# 12. HABITS

System nawyków ma być bardzo szybki.

Przykład:

```text
10k steps
Mon ✓
Tue ✓
Wed ✓
Thu ✓
Fri ✕
Sat ✓
Sun ✓
```

Habit zawiera:

```text
name
description
frequency
target
unit
color
icon
start_date
end_date
active
```

Frequency:

- daily,
- weekly,
- selected weekdays,
- x-times-per-week,
- custom.

Typ:

```text
Boolean
Numeric
Duration
Count
```

Przykłady:

```text
Read
Boolean

Drink water
Numeric
2.0 L

Meditate
Duration
10 minutes

Push ups
Count
50
```

Nie ograniczaj systemu do streaków.

Pokazuj także:

- completion rate,
- consistency,
- monthly success,
- best streak,
- missed days,
- trends.

---

# 13. ROUTINES

Rutyna = grupa czynności wykonywanych regularnie.

Przykład:

```text
Morning Routine

Wake up
Drink water
Stretch
Breakfast
Plan day
```

Obsługuj:

- kolejność,
- czas,
- zadania,
- habits,
- checklist,
- estimated duration.

Rutyny:

- morning,
- evening,
- work start,
- work end,
- pre-workout,
- travel,
- custom.

---

# 14. FINANCES

Moduł finansowy powinien być bardzo rozbudowany.

Nie buduj pełnej księgowości firmy.

Skup się na finansach osobistych.

## Accounts

Przykłady:

```text
Main Bank Account
Savings
Cash
Credit Card
Investment
Loan
```

Każde konto:

```text
name
type
currency
balance
institution
active
```

## Transactions

```text
date
amount
type
category
account
merchant
description
tags
recurring
```

Typ:

```text
Income
Expense
Transfer
```

## Categories

Przykładowe:

```text
Housing
Food
Transport
Health
Entertainment
Shopping
Travel
Education
Subscriptions
Utilities
Other
```

Kategorie muszą być edytowalne.

## Budgets

Użytkownik może stworzyć:

```text
Food
800 PLN
Used: 560 PLN
Remaining: 240 PLN
```

Widok miesięczny:

```text
Income
Expenses
Savings
Savings rate
Budget utilization
```

## Recurring transactions

Na przykład:

```text
Rent
Salary
Internet
Subscription
Loan
```

## Net worth

Obliczaj:

```text
Assets
-
Liabilities
=
Net Worth
```

Pokaż trend w czasie.

## Financial goals

Integracja z Goals.

Przykład:

```text
Emergency Fund
20 000 / 30 000 PLN
```

## Forecast

System powinien szacować:

```text
Expected monthly income
Expected monthly expenses
Expected savings
Expected end-of-month balance
```

---

# 15. FINANCIAL ANALYTICS

Dashboard finansowy:

```text
Income vs Expenses

Savings Rate

Top Categories

Monthly Spending

Net Worth

Cash Flow

Recurring Costs
```

Zakres:

- month,
- quarter,
- year,
- custom.

---

# 16. WORKOUTS

Moduł treningowy ma obsługiwać różne typy aktywności.

Typy:

```text
Strength
Running
Cycling
Walking
Swimming
Padel
Football
Mobility
Custom
```

## Workout

```text
name
type
date
duration
distance
calories
notes
```

Strength workout:

```text
Exercise
Set
Weight
Reps
RPE
Rest
```

Przykład:

```text
Bench Press

Set 1
60kg × 10

Set 2
60kg × 9

Set 3
55kg × 10
```

Obsługuj:

- exercise library,
- workout templates,
- workout plans,
- progression,
- personal records,
- volume,
- weekly frequency.

## Running

Obsługuj:

- distance,
- pace,
- duration,
- elevation,
- average heart rate,
- splits.

---

# 17. TRAINING PLANS

Użytkownik powinien móc utworzyć plan:

```text
Half Marathon — 12 weeks
```

Tygodnie:

```text
Mon — Rest
Tue — Intervals
Wed — Easy Run
Thu — Strength
Fri — Rest
Sat — Long Run
Sun — Mobility
```

Każdy trening może być powiązany z goal.

---

# 18. ACTIVITY

Główny dashboard aktywności:

```text
Steps
Distance
Active minutes
Calories
Workouts
Training time
```

Przygotuj architekturę pod późniejsze integracje:

- Apple Health,
- Google Fit / Health Connect,
- Garmin,
- Strava,
- Fitbit.

Nie implementuj wszystkich integracji w MVP.

Zaprojektuj jednak model danych tak, żeby można było je później dodać.

---

# 19. CALENDAR

Aplikacja powinna mieć własny kalendarz.

Widoki:

- Day
- Week
- Month
- Agenda

Events:

```text
title
start
end
location
description
repeat
color
linked_project
linked_task
```

Przygotuj architekturę pod:

- Google Calendar,
- Outlook Calendar,
- Apple Calendar.

Integracje mogą być późniejszym etapem.

---

# 20. NOTES

Prosty system notatek.

Każda notatka:

```text
title
content
tags
created_at
updated_at
```

Powiązania:

```text
Note
→ Project
→ Goal
→ Workout
→ Task
→ Finance
→ Journal entry
```

Editor powinien być przyjemny i szybki.

Można użyć:
- Tiptap
- lub innego dojrzałego edytora rich text.

---

# 21. JOURNAL

Dziennik ma być opcjonalny.

Widok:

```text
October 4

How was your day?

Today I...
Tomorrow I...
What went well?
What could be better?
```

Nie wymuszaj journalingu.

System może automatycznie podsumować dzień na podstawie:

- tasks,
- habits,
- workouts,
- calendar,
- finances.

---

# 22. SHOPPING LIST

Prosty moduł:

```text
Shopping List

Milk
Eggs
Chicken
Vegetables
Toilet paper
```

Obsługuj:

- listy,
- produkty,
- ilość,
- kategorie,
- purchased/unpurchased.

Przygotuj możliwość późniejszego połączenia z meal planning.

---

# 23. LIFE AREAS

Dodaj koncepcję:

**Life Areas**

Przykłady:

```text
Finance
Career
Health
Fitness
Learning
Relationships
Home
Travel
Personal
```

Każdy element aplikacji może należeć do jednej lub kilku kategorii.

Dzięki temu można zbudować widok:

```text
Life Balance

Finance        82%
Career         67%
Fitness        74%
Learning       53%
Relationships  61%
Home           89%
```

Nie twórz arbitralnego „health score” bez sensownego modelu.

W MVP pokazuj dane i trendy, a nie udawaj naukowego pomiaru jakości życia.

---

# 24. REVIEWS

Bardzo ważna funkcja.

## Daily Review

```text
Completed tasks
Habits
Workout
Spending
Calendar
Notes
```

## Weekly Review

System generuje:

```text
Week overview

Tasks completed: 27
Habits: 84%
Workouts: 4
Expenses: 1 420 PLN
Savings: 1 980 PLN

Wins

What didn't go well?

Next week's priorities
```

## Monthly Review

Podsumowanie:

- finances,
- goals,
- habits,
- training,
- projects,
- productivity.

---

# 25. ANALYTICS

Centralny moduł analityczny.

Kategorie:

```text
Finance
Productivity
Habits
Fitness
Goals
Time
```

Przykłady:

### Productivity

```text
Tasks completed
Completion rate
Overdue tasks
Focus time
Projects completed
```

### Habits

```text
Completion rate
Best habits
Weakest habits
Consistency
```

### Finance

```text
Income
Expenses
Savings
Net worth
```

### Fitness

```text
Workouts
Training time
Distance
Volume
PRs
```

Wszystko z filtrem:

```text
7D
30D
90D
6M
1Y
ALL
```

---

# 26. NOTIFICATIONS

System powiadomień powinien obsługiwać:

- task reminders,
- habit reminders,
- workout reminders,
- budget warnings,
- upcoming deadlines,
- goal milestones,
- recurring transactions.

Użytkownik może ustawić preferencje.

Nie bombarduj użytkownika.

Domyślna zasada:

**lepiej mniej wartościowych powiadomień niż dużo bezwartościowych.**

---

# 27. SEARCH

Global search.

Skrót:

```text
⌘ K
```

lub:

```text
Ctrl K
```

Search przez:

- tasks,
- projects,
- goals,
- habits,
- notes,
- transactions,
- workouts.

Wyniki pogrupowane według typu.

Przykład:

```text
Search: Berlin

Projects
Move to Berlin

Tasks
Research Berlin neighborhoods

Notes
Berlin budget

Goals
Move abroad
```

---

# 28. COMMAND PALETTE

Dodaj command palette.

Przykłady:

```text
Create task
Create expense
Create habit
Start workout
Open calendar
Open finances
Search everything
Go to today
Start morning routine
```

---

# 29. QUICK CAPTURE

To jedna z najważniejszych funkcji.

Użytkownik powinien móc w każdym miejscu nacisnąć:

```text
+
```

i wybrać:

```text
Task
Expense
Habit
Workout
Note
Goal
Event
```

Quick capture powinien być bardzo szybki.

---

# 30. AI ARCHITECTURE

AI traktuj jako przyszłą warstwę aplikacji.

Nie buduj całego produktu wokół jednego providera AI.

Stwórz abstrakcję:

```text
AIProvider
```

tak, aby później można było podpiąć różne modele.

Potencjalne funkcje:

### AI Daily Brief

```text
Today you have 5 important tasks.
You have a workout at 18:00.
You are 220 PLN over your average weekly food spending.
Your savings goal is on track.
```

### AI Planning

Użytkownik:

```text
I want to prepare for a half marathon in 12 weeks.
```

System proponuje:

- milestones,
- weekly plan,
- tasks,
- workouts.

### AI Finance Summary

```text
Your expenses increased 12% this month,
mainly because of travel and dining.
```

### AI Weekly Review

Automatyczne podsumowanie tygodnia.

### Natural Language Input

```text
Spent 54 PLN on groceries at Lidl.
```

System rozpoznaje:

```text
amount = 54
type = expense
category = food
merchant = Lidl
```

AI nie może wykonywać nieodwracalnych operacji bez potwierdzenia użytkownika.

---

# 31. DATABASE ARCHITECTURE

Zaprojektuj relacyjną bazę PostgreSQL.

Minimalne główne tabele:

```text
profiles

accounts

transactions
transaction_categories
budgets
budget_categories

tasks
task_tags
tags

projects
project_members

goals
goal_milestones

habits
habit_logs

routines
routine_items

calendar_events

workout_templates
workouts
workout_exercises
exercises
workout_sets

activity_records

notes
note_links

journal_entries

shopping_lists
shopping_items

notifications

life_areas

daily_reviews
weekly_reviews
monthly_reviews

user_preferences
```

Każda tabela związana z użytkownikiem musi mieć właściwe:

```text
id
user_id
created_at
updated_at
```

tam, gdzie ma to sens.

---

# 32. DATABASE PRINCIPLES

Nigdy nie przechowuj rzeczy, które można poprawnie wyliczyć, jako niezależnego źródła prawdy bez potrzeby.

Przykład:

Saldo konta powinno mieć jasno zdefiniowane źródło prawdy.

Nie dopuszczaj do sytuacji:

```text
account.balance = 5000

transactions = 4800
```

jeżeli model nie definiuje, dlaczego występuje różnica.

Każdy model musi posiadać:

- primary key,
- foreign keys,
- indeksy,
- constraints,
- sensible defaults.

Zadbaj o:

- unique constraints,
- cascading rules,
- soft delete tam, gdzie jest potrzebny,
- timestamps.

---

# 33. SECURITY

Bezpieczeństwo jest priorytetem.

Wszystkie dane użytkownika muszą być izolowane.

Supabase Row Level Security musi uniemożliwić użytkownikowi dostęp do danych innych użytkowników.

Nigdy nie zakładaj bezpieczeństwa wyłącznie na podstawie UI.

Waliduj dane również po stronie serwera.

Nigdy nie ufaj:

```text
user_id
role
permissions
amount
```

pochodzącym wyłącznie z klienta.

---

# 34. FINANCIAL SECURITY

Dane finansowe traktuj jako dane wrażliwe.

Nie loguj:

- pełnych danych transakcji,
- tokenów,
- haseł,
- secretów,
- credentials.

Nigdy nie umieszczaj kluczy API w frontendzie.

Używaj:

```text
environment variables
```

dla sekretów.

---

# 35. GDPR

Aplikacja powinna być przygotowana pod GDPR.

Użytkownik powinien móc:

- pobrać swoje dane,
- usunąć konto,
- usunąć poszczególne rekordy,
- wyeksportować dane.

Dodaj:

```text
Settings
→ Privacy
→ Export data
→ Delete account
```

---

# 36. ONBOARDING

Pierwsze uruchomienie:

### Step 1

```text
What do you want to manage?
```

Wybory:

```text
Finances
Productivity
Habits
Fitness
Goals
Planning
Everything
```

### Step 2

Użytkownik może ustawić podstawowe informacje:

- waluta,
- timezone,
- first day of week,
- preferred units,
- notification preferences.

### Step 3

Pokaż propozycję konfiguracji:

```text
Add your first goal
Create your first habit
Add your main financial account
Plan tomorrow
```

Nie wymuszaj kompletnej konfiguracji.

Można pominąć każdy krok.

---

# 37. MOBILE UX

Aplikacja musi być responsywna.

Mobile-first w kluczowych interakcjach.

Na mobile priorytetem:

- Today,
- tasks,
- habits,
- quick capture,
- workouts,
- finances.

Unikaj ogromnych tabel.

Tabela finansowa na desktopie może zostać zamieniona na karty/listę na mobile.

---

# 38. ACCESSIBILITY

Minimum:

- semantyczny HTML,
- keyboard navigation,
- visible focus,
- aria labels,
- odpowiedni kontrast,
- poprawne formularze,
- sensowne komunikaty błędów.

Cała aplikacja powinna być używalna z klawiaturą.

---

# 39. EMPTY STATES

Każda sekcja musi mieć dobrze zaprojektowany empty state.

Nie:

```text
No data.
```

Lepiej:

```text
No goals yet

Create your first goal and start tracking progress.

+ Create goal
```

---

# 40. LOADING STATES

Nigdy nie pokazuj pustej strony podczas ładowania.

Używaj:

- skeletons,
- optimistic updates,
- loading states.

---

# 41. ERROR HANDLING

Błędy muszą być zrozumiałe dla człowieka.

Nie pokazuj:

```text
Error 500
```

bez kontekstu.

Zamiast:

```text
We couldn't save this transaction.
Please try again.
```

Loguj szczegóły techniczne po stronie systemu.

---

# 42. UX PRINCIPLES

Każda operacja powinna być możliwie szybka.

Przykład dodania wydatku:

Idealny flow:

```text
+
Expense
54
Groceries
Save
```

Nie:

```text
Open page
Select account
Select category
Select type
Select date
...
```

System powinien zapamiętywać ostatnie wybory i inteligentnie je sugerować.

---

# 43. SMART DEFAULTS

Przykłady:

Jeżeli użytkownik dodaje wydatek:

```text
date = today
```

Jeżeli dodaje task:

```text
status = todo
```

Jeżeli dodaje habit:

```text
start_date = today
```

Jeżeli zaczyna trening:

```text
date = today
```

Nie pytaj o rzeczy, które można logicznie wywnioskować.

---

# 44. PERSONALIZATION

Użytkownik może ustawiać:

```text
Currency
Timezone
Week starts Monday/Sunday
Date format
Units
Theme
Accent
Dashboard layout
Notification settings
```

Theme:

```text
Light
Dark
System
```

---

# 45. DARK MODE

Dark mode musi być projektowany osobno.

Nie wystarczy odwrócić kolorów.

Zadbaj o:

- kontrast,
- wykresy,
- statusy,
- hover states,
- modal windows,
- formularze,
- sidebar.

---

# 46. PERFORMANCE

Cel:

- szybkie pierwsze renderowanie,
- minimalny JavaScript tam, gdzie możliwe,
- lazy loading ciężkich modułów,
- paginacja,
- właściwe indeksy SQL,
- memoizacja tylko tam, gdzie ma sens.

Nie optymalizuj przedwcześnie.

Najpierw poprawna architektura.

---

# 47. OFFLINE / RESILIENCE

Przygotuj architekturę pod częściowy offline.

Minimum:

- cache podstawowego UI,
- dostęp do ostatnich danych,
- możliwość wykonania prostych operacji,
- synchronizacja po odzyskaniu połączenia.

Nie musisz implementować pełnej synchronizacji w pierwszym MVP, ale nie projektuj aplikacji w sposób, który uniemożliwi jej późniejsze wdrożenie.

---

# 48. AUDITABILITY

Dla ważnych operacji finansowych i systemowych zachowuj:

- created_at,
- updated_at,
- kto wykonał operację,
- źródło operacji, jeśli jest potrzebne.

---

# 49. IMPORT / EXPORT

System powinien wspierać:

```text
CSV
JSON
```

dla odpowiednich danych.

Przykładowo:

```text
Import transactions
Export transactions
Export all data
```

Później:

- bank integrations,
- Open Banking,
- Revolut,
- Plaid / odpowiedniki europejskie.

Nie implementuj integracji bankowych w MVP.

---

# 50. SETTINGS

Struktura:

```text
Settings

Profile
Preferences
Appearance
Notifications
Privacy
Security
Data
Integrations
Billing
```

Billing może początkowo być placeholderem.

---

# 51. PRZYGOTOWANIE POD MULTI-USER

MVP jest aplikacją personalną.

Mimo tego architektura powinna być przygotowana pod:

- household,
- couples,
- shared projects,
- shared shopping lists,
- shared finances.

Nie implementuj tego na siłę w MVP.

---

# 52. PRZYGOTOWANIE POD SUBSKRYPCJĘ

Projekt może być kiedyś oferowany jako SaaS.

Dlatego kod powinien być przygotowany pod:

```text
Free
Pro
```

Nie ograniczaj funkcji w MVP sztucznie.

Warstwa billingowa może zostać dodana później.

---

# 53. AI SAFETY

AI nie może:

- podejmować decyzji finansowych za użytkownika,
- automatycznie wykonywać przelewów,
- usuwać danych,
- tworzyć nieodwracalnych operacji bez potwierdzenia.

AI może:

- analizować,
- sugerować,
- podsumowywać,
- klasyfikować,
- planować,
- generować drafty.

Akcje destrukcyjne zawsze wymagają explicit confirmation.

---

# 54. HOME DASHBOARD — PRIORYTETY

Dashboard powinien wykorzystać logiczny ranking informacji.

### P0

- Today's tasks
- Calendar
- Habits
- Important reminders

### P1

- Goals
- Finances
- Workout

### P2

- Analytics
- Reviews
- Notes

Nie pokazuj wszystkiego jednocześnie.

---

# 55. MVP

Nie próbuj budować całego produktu od razu.

MVP powinno zawierać:

### Authentication
- signup
- login
- logout
- profile

### Dashboard
- Today
- quick actions

### Tasks
- CRUD
- priorities
- due dates
- recurring tasks
- projects

### Goals
- CRUD
- milestones
- progress

### Habits
- CRUD
- tracking
- statistics

### Finances
- accounts
- categories
- transactions
- budgets
- basic analytics

### Calendar
- events
- day/week/month

### Workouts
- exercises
- sessions
- basic statistics

### Search
- global search

### Settings
- profile
- preferences
- theme

---

# 56. VERSION 2

Po ukończeniu MVP:

- routines,
- advanced workout plans,
- journal,
- notes,
- shopping,
- advanced analytics,
- reviews,
- notifications,
- imports/exports,
- PWA,
- offline support.

---

# 57. VERSION 3

Następnie:

- AI assistant,
- natural language input,
- Google Calendar integration,
- bank integrations,
- health integrations,
- advanced forecasting,
- shared household,
- mobile app.

---

# 58. PROJECT STRUCTURE

Preferuj modularną architekturę.

Przykład:

```text
src/

app/
  (auth)/
  (dashboard)/
    dashboard/
    today/
    tasks/
    projects/
    goals/
    habits/
    routines/
    finances/
    calendar/
    workouts/
    notes/
    journal/
    analytics/
    settings/

components/
  ui/
  dashboard/
  tasks/
  finances/
  habits/
  workouts/
  goals/

lib/
  auth/
  db/
  finance/
  tasks/
  habits/
  workouts/
  goals/
  analytics/
  notifications/

types/

schemas/

hooks/

services/

utils/
```

Nie twórz jednego ogromnego pliku.

---

# 59. COMPONENT PRINCIPLES

Komponent powinien robić jedną rzecz dobrze.

Nie twórz:

```text
MegaDashboard.tsx
```

mającego 2500 linii.

Podziel na:

```text
DashboardHeader
TodayOverview
FinanceSnapshot
HabitOverview
GoalOverview
WorkoutOverview
QuickActions
```

---

# 60. SERVER VS CLIENT COMPONENTS

Domyślnie preferuj server components.

Client components tylko tam, gdzie potrzebne są:

- interakcje,
- state,
- browser APIs,
- animations,
- forms wymagające client state.

---

# 61. API DESIGN

Jeżeli tworzysz API:

```text
/api/tasks
/api/goals
/api/habits
/api/finances/accounts
/api/finances/transactions
/api/workouts
```

API powinno być:

- przewidywalne,
- walidowane,
- typowane,
- zabezpieczone.

---

# 62. DATA ACCESS

Nie wykonuj zapytań SQL bezpośrednio w losowych komponentach UI.

Wprowadź warstwę:

```text
repository
service
```

Przykład:

```text
TaskRepository
TaskService
```

Dzięki temu łatwiejsza będzie późniejsza zmiana backendu.

---

# 63. TYPES

Unikaj:

```text
any
```

praktycznie wszędzie.

TypeScript ma działać w strict mode.

Typy muszą być spójne pomiędzy:

- database,
- server,
- API,
- frontend.

---

# 64. FORMS

Każdy formularz powinien:

- walidować dane,
- pokazywać błędy,
- posiadać loading state,
- blokować double-submit,
- po sukcesie pokazywać confirmation,
- zachowywać dane, jeśli wystąpi błąd.

---

# 65. CONFIRMATION UX

Nie pokazuj modala dla każdej drobnej czynności.

Potwierdzenie wymagaj głównie przy:

- delete account,
- delete financial data,
- large destructive actions.

Przy zwykłym delete item:

```text
Undo
```

jest często lepsze niż dodatkowe potwierdzenie.

---

# 66. TOASTS

Używaj toastów oszczędnie.

Przykłady:

```text
Transaction saved
Task completed
Habit updated
Goal created
```

Nie pokazuj toastów przy każdej nawigacji.

---

# 67. ANALYTICS ENGINE

Zaprojektuj wewnętrzną warstwę analytics.

Powinna móc obliczać:

```text
Task completion rate
Habit completion rate
Savings rate
Goal progress
Workout frequency
Spending trend
Net worth trend
```

Nie licz wszystkiego w samym UI.

---

# 68. TIMEZONE

To bardzo ważne.

Każdy użytkownik ma timezone.

Domyślnie wykrywaj timezone przeglądarki, ale pozwalaj użytkownikowi go zmienić.

Daty i czas muszą być obsługiwane konsekwentnie.

Szczególnie:

- recurring tasks,
- habits,
- calendar,
- reminders,
- daily reviews.

---

# 69. MONEY

Nie przechowuj pieniędzy jako floating point.

Używaj:

```text
integer minor units
```

lub decimal type w bazie.

Przykład:

```text
1050 PLN
```

powinno być przechowywane precyzyjnie, bez błędów floating point.

Obsługuj waluty jako:

```text
ISO 4217
```

---

# 70. AUDIT OF UX

Po każdym większym module zadaj sobie pytania:

```text
Can I understand this in 3 seconds?

Can I add an item in under 10 seconds?

Can I edit it without opening five screens?

Can I use this on mobile?

Does the screen show what matters?

Is there unnecessary information?

Is the next action obvious?
```

---

# 71. DEVELOPMENT WORKFLOW

Pracuj iteracyjnie.

Nigdy nie generuj całej aplikacji na raz.

Kolejność:

## PHASE 1 — FOUNDATION

1. Initialize project.
2. Configure TypeScript.
3. Configure Tailwind.
4. Configure shadcn/ui.
5. Configure linting.
6. Configure formatting.
7. Configure Supabase.
8. Configure environment variables.
9. Create database.
10. Configure authentication.
11. Build application shell.
12. Build sidebar.
13. Build mobile navigation.
14. Build theme system.

Po zakończeniu uruchom:

```text
typecheck
lint
tests
build
```

Napraw wszystkie błędy.

---

# 72. PHASE 2 — TASKS

Zbuduj:

- database,
- repository,
- service,
- server actions/API,
- UI,
- filters,
- CRUD,
- subtasks,
- recurring tasks,
- projects.

Dodaj testy.

---

# 73. PHASE 3 — GOALS

Zbuduj:

- goals,
- milestones,
- progress,
- project linking,
- task linking,
- dashboard.

Dodaj testy.

---

# 74. PHASE 4 — HABITS

Zbuduj:

- habits,
- frequencies,
- tracking,
- streaks,
- statistics,
- calendar view.

Dodaj testy.

---

# 75. PHASE 5 — FINANCES

Najbardziej ostrożnie.

Kolejność:

```text
Accounts
↓
Categories
↓
Transactions
↓
Transfers
↓
Budgets
↓
Recurring transactions
↓
Analytics
↓
Net worth
```

Testuj szczególnie:

- sumy,
- transfery,
- waluty,
- daty,
- usuwanie transakcji,
- korekty.

---

# 76. PHASE 6 — CALENDAR

Zbuduj:

- events,
- day view,
- week view,
- month view,
- agenda,
- recurring events.

---

# 77. PHASE 7 — WORKOUTS

Kolejność:

```text
Exercises
↓
Workout templates
↓
Workout sessions
↓
Sets
↓
Statistics
↓
Plans
```

---

# 78. PHASE 8 — INTEGRATED DASHBOARD

Dopiero po stworzeniu modułów połącz je w jeden dashboard.

Dashboard powinien pobierać dane z prawdziwych modułów.

Nigdy nie twórz fake data tylko po to, żeby dashboard wyglądał dobrze.

---

# 79. SEED DATA

Dla developmentu utwórz realistyczne przykładowe dane.

Np.:

```text
5 accounts
30 transactions
5 goals
8 habits
3 projects
20 tasks
10 calendar events
5 workouts
```

Seed data ma być realistyczna, ale nie może być wymagana w produkcji.

---

# 80. TEST DATA ISOLATION

Testy muszą używać osobnego środowiska / danych.

Nie wolno uruchomieniem testów modyfikować produkcyjnych danych.

---

# 81. TESTING

Każdy kluczowy moduł ma mieć testy.

### Unit tests

Testuj:

- calculations,
- finance logic,
- goal progress,
- habit streak calculations,
- date recurrence,
- analytics.

### Component tests

Testuj:

- forms,
- task interactions,
- filters,
- charts where meaningful.

### E2E

Minimum:

```text
Signup
Login
Create task
Complete task
Create goal
Create habit
Log habit
Create account
Create expense
Check dashboard
Logout
```

---

# 82. DEFINITION OF DONE

Nie uznawaj feature za ukończony, jeżeli:

- tylko wygląda dobrze,
- backend nie działa,
- nie ma walidacji,
- nie ma loading states,
- nie ma error states,
- nie działa mobile,
- powoduje TypeScript errors,
- powoduje lint errors,
- psuje istniejące funkcje.

Feature jest ukończony dopiero, gdy:

```text
UI
+
Backend
+
Database
+
Validation
+
Error handling
+
Loading states
+
Responsive UX
+
Tests
```

są gotowe.

---

# 83. CLAUDE CODE BEHAVIOR

Podczas implementacji przestrzegaj następujących zasad.

### Zasada 1

Nie pytaj mnie o każdą drobną decyzję.

Jeżeli decyzja nie ma dużego wpływu na architekturę, wybierz rozsądne rozwiązanie samodzielnie.

### Zasada 2

Jeżeli znajdziesz istniejący problem w kodzie, napraw go, o ile jest bezpośrednio związany z aktualnym zadaniem.

### Zasada 3

Nie twórz zbędnej abstrakcji.

### Zasada 4

Nie duplikuj kodu.

### Zasada 5

Nie implementuj fake API.

### Zasada 6

Nie hard-code'uj danych, które powinny pochodzić z bazy.

### Zasada 7

Nie kończ pracy na „UI wygląda dobrze”.

Zawsze sprawdzaj funkcjonalność.

### Zasada 8

Po większym etapie uruchom:

```text
typecheck
lint
tests
build
```

i napraw błędy.

### Zasada 9

Nie zmieniaj działającego modułu tylko dlatego, że istnieje inna preferowana technologia.

### Zasada 10

Priorytet:

```text
Correctness
Security
Maintainability
UX
Performance
Aesthetics
```

---

# 84. GIT

Pracuj w małych, logicznych commitach.

Preferowany styl:

```text
feat: add task management
feat: add habit tracking
feat: add finance transactions
fix: correct recurring task dates
refactor: extract finance service
test: add budget calculations
```

Nie twórz ogromnych commitów obejmujących wszystko.

---

# 85. DOCUMENTATION

Utrzymuj:

```text
README.md
ARCHITECTURE.md
DATABASE.md
ROADMAP.md
```

README musi zawierać:

- installation,
- environment variables,
- database setup,
- development commands,
- test commands,
- deployment.

---

# 86. ENVIRONMENT VARIABLES

Utwórz:

```text
.env.example
```

Nie commituj:

```text
.env
```

Nigdy nie wpisuj sekretów do kodu.

---

# 87. DEPLOYMENT

Przygotuj aplikację do deploymentu na:

- Vercel lub równoważny hosting,
- Supabase.

Production build musi działać przed uznaniem projektu za gotowy.

---

# 88. LOGGING

Logowanie ma być użyteczne, ale bez ujawniania danych wrażliwych.

Nigdy nie loguj:

- password,
- access token,
- refresh token,
- API key,
- pełnych danych finansowych.

---

# 89. ACCESS CONTROL

Architektura musi rozdzielać:

```text
anonymous
authenticated
admin
```

Nawet jeśli w MVP istnieje tylko authenticated.

---

# 90. FUTURE FEATURES

Pozostaw miejsca w architekturze na:

```text
AI
Bank connections
Calendar integrations
Health integrations
Wearables
Shared households
Subscriptions
Mobile apps
Push notifications
Email summaries
Smart recommendations
Automations
```

Nie implementuj ich wszystkich teraz.

---

# 91. LONG-TERM VISION

Docelowo LifeOS powinien być osobistym systemem operacyjnym użytkownika.

Użytkownik otwiera aplikację rano i widzi:

```text
TODAY

Your priorities
Your schedule
Your habits
Your workout
Your money
Your goals
```

Wieczorem:

```text
DAY REVIEW

What you accomplished
What remains
What you spent
How your habits went
How you trained
```

W niedzielę:

```text
WEEKLY REVIEW

What happened
What improved
What declined
What matters next week
```

Na koniec miesiąca:

```text
MONTHLY REVIEW

Money
Goals
Fitness
Habits
Projects
Time
Progress
```

Aplikacja ma pomagać użytkownikowi **żyć lepiej i podejmować lepsze decyzje**, a nie tylko przechowywać dane.

---

# 92. FIRST TASK

Nie zaczynaj od budowy wszystkich modułów.

Najpierw:

1. Utwórz projekt.
2. Zdefiniuj architekturę.
3. Skonfiguruj stack.
4. Skonfiguruj Supabase.
5. Utwórz schema bazy.
6. Włącz RLS.
7. Zbuduj authentication.
8. Zbuduj główny application shell.
9. Zbuduj sidebar.
10. Zbuduj responsive navigation.
11. Zbuduj dashboard skeleton.
12. Utwórz podstawowy design system.

Następnie uruchom:

```text
typecheck
lint
tests
build
```

Napraw wszystkie błędy.

Dopiero wtedy rozpocznij moduł Tasks.

---

# 93. FINAL PRODUCT STANDARD

Produkt końcowy ma wyglądać jak produkt komercyjny, a nie projekt studencki.

Nie akceptuję:

- przypadkowych odstępów,
- niespójnych komponentów,
- placeholderów,
- fake data w produkcji,
- martwych przycisków,
- niespójnych ikon,
- nieprzemyślanych formularzy,
- nieczytelnych wykresów,
- nadmiaru modalów,
- ogromnych komponentów,
- braku obsługi błędów.

Każdy ekran powinien sprawiać wrażenie części tego samego systemu.

---

# 94. NAJWAŻNIEJSZA ZASADA PRODUKTOWA

LifeOS ma odpowiadać na trzy pytania:

### 1. TERAZ

> Co dzieje się teraz?

### 2. NASTĘPNIE

> Co powinienem zrobić jako następne?

### 3. DŁUGOTERMINOWO

> Czy moje codzienne działania prowadzą mnie do życia, którego chcę?

Cała architektura produktu powinna wspierać te trzy pytania.

---

# 95. INSTRUKCJA KOŃCOWA DLA CLAUDE CODE

Buduj aplikację iteracyjnie.

Nie generuj jedynie kodu „na pokaz”.

Każdy etap ma kończyć się działającym, przetestowanym fragmentem produktu.

Podejmuj rozsądne decyzje techniczne samodzielnie.

Gdy istnieje kilka poprawnych rozwiązań, wybieraj to, które:

1. jest prostsze,
2. jest łatwiejsze w utrzymaniu,
3. dobrze skaluje się w przyszłości,
4. zapewnia dobre UX,
5. nie komplikuje niepotrzebnie projektu.

Przede wszystkim:

**Build a real product, not a demo.**

Kod ma być:

```text
production-ready
secure
typed
tested
maintainable
responsive
accessible
```

A UX ma być:

```text
simple
fast
calm
clear
useful
```

Zawsze przed implementacją większego feature'a najpierw przeanalizuj jego miejsce w całym systemie LifeOS, aby nie tworzyć funkcjonalności oderwanej od pozostałych modułów.

# END OF MASTER INSTRUCTION
