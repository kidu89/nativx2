// AppWeaver INFINITY - Root Build Configuration
// Android Project Template

plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}

// Note: repositories are managed in settings.gradle.kts
// Do NOT add allprojects { repositories {} } block - it conflicts with Gradle 8.x

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}

