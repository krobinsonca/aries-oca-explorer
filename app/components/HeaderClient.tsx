'use client';

import React from "react";
import { Button, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

interface HeaderClientProps {
  children: React.ReactNode;
}

export default function HeaderClient({ children }: HeaderClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const readonly = searchParams.get('view') === 'readonly';

  // Check if we're on a detail page (identifier/[id])
  const isDetailPage = pathname?.startsWith('/identifier/');

  return (
    <>
      {isDetailPage && (
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          variant="outlined"
          aria-label="Go back to previous page"
          sx={{
            mr: 2,
            color: 'white',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          Back
        </Button>
      )}

      {children}

      <Box sx={{ ml: "auto" }} role="complementary" aria-label="Theme controls">
        <ThemeToggle />
      </Box>
    </>
  );
}