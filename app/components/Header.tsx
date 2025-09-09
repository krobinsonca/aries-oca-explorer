'use client';

import React from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import imgUrl from "../assets/images/BCID_H_rgb_rev.svg";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const readonly = searchParams.get('view') === 'readonly';
  
  // Check if we're on a detail page (identifier/[id])
  const isDetailPage = pathname?.startsWith('/identifier/');

  return (
    readonly || <header style={{ paddingBottom: "10px" }}>
      <AppBar
        position="fixed"
        sx={{
          alignItems: "flex-start",
          height: "64px",
          flex: 1,
          justifyContent: "left",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <Toolbar sx={{ width: "100%" }}>
          {isDetailPage && (
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.back()}
              variant="outlined"
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
          
          <Image
            src={imgUrl}
            alt="Go to the Government of British Columbia website"
            priority
            style={{
              width: "100%",
              height: "100%",
              maxHeight: "48px",
              flex: 1,
            }}
          />
          <Box sx={{ ml: "auto" }}>
            <ThemeToggle />
          </Box>
        </Toolbar>
      </AppBar>
    </header>
  );
}