'use client';

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useLanguage } from '@/app/contexts/Language';

export default function LanguageSwitcher() {
  const { language, setLanguage, availableLanguages } = useLanguage();

  const handleLanguageChange = (event: SelectChangeEvent) => {
    setLanguage(event.target.value as 'en' | 'fr');
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'en':
        return 'English';
      case 'fr':
        return 'Français';
      default:
        return lang;
    }
  };

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel id="language-select-label">Language</InputLabel>
      <Select
        labelId="language-select-label"
        value={language}
        label="Language"
        onChange={handleLanguageChange}
      >
        {availableLanguages.map((lang) => (
          <MenuItem key={lang} value={lang}>
            {getLanguageLabel(lang)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
