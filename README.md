# XpenseMeter

A native Android expense tracking app built with Kotlin. Track your payments and income with category-based organization and visual analytics.

## Features

- **Paid / Received** - Quick entry for money going out or coming in
- **Category & Subcategory** - Organized dropdown-based categorization (Food, Shopping, Travel, etc.)
- **Notes** - Add optional notes to any transaction
- **Time Filters** - View transactions for Today, This Week, This Month, or All Time
- **Analytics Dashboard** - Pie charts, bar charts, and trend lines for spending insights
- **Local Storage** - All data stored locally using Room database

## Tech Stack

- **Language**: Kotlin
- **Architecture**: MVVM (ViewModel + LiveData + Room)
- **UI**: Material Design 3 + ViewBinding
- **Charts**: MPAndroidChart
- **Database**: Room (SQLite)
- **Min SDK**: 24 (Android 7.0)

## Build

```bash
./gradlew assembleDebug
```

The APK will be at `app/build/outputs/apk/debug/app-debug.apk`.

## Project Structure

```
app/src/main/java/com/xpense/meter/
├── data/
│   ├── db/          # Room database, DAO, converters
│   ├── model/       # Transaction entity, CategoryMapping
│   └── repository/  # TransactionRepository
├── ui/
│   ├── home/        # HomeFragment, TransactionAdapter
│   ├── analytics/   # AnalyticsFragment, charts
│   └── addentry/    # AddEntryBottomSheet
├── MainActivity.kt
└── XpenseMeterApp.kt
```
