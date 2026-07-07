import 'package:flutter/material.dart';
import '../config/app_config.dart';

ThemeData buildAppTheme() {
  const purple = AppColors.purple;
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: const ColorScheme.dark(
      primary: purple,
      secondary: purple,
      surface: AppColors.surface,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.surface,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: AppColors.card,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.surface,
      indicatorColor: purple.withValues(alpha: 0.3),
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(fontSize: 12, color: Colors.white70),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.card,
      selectedColor: purple.withValues(alpha: 0.4),
      labelStyle: const TextStyle(color: Colors.white),
    ),
  );
}
