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
        aria-label="Select language"
        role="combobox"
        aria-expanded={false}
        sx={{
          '&:focus': {
            outline: '2px solid #1976d2',
            outlineOffset: '2px',
          },
        }}
      >
        {availableLanguages.map((lang) => (
          <MenuItem 
            key={lang} 
            value={lang}
            role="option"
            aria-selected={language === lang}
          >
            {getLanguageLabel(lang)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
