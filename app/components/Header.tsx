import React, { Suspense } from "react";
import { AppBar, Toolbar } from "@mui/material";
import imgUrl from "../assets/images/BCID_H_rgb_rev.svg";
import Image from "next/image";
import HeaderClient from "./HeaderClient";

export default function Header() {
  return (
    <header style={{ paddingBottom: "10px" }}>
      <AppBar
        position="fixed"
        role="banner"
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
        <Toolbar sx={{ width: "100%" }} role="navigation" aria-label="Main navigation">
          <Suspense fallback={
            <Image
              src={imgUrl}
              alt="Government of British Columbia logo - Go to the Government of British Columbia website"
              priority
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "48px",
                flex: 1,
              }}
            />
          }>
            <HeaderClient>
              <Image
                src={imgUrl}
                alt="Government of British Columbia logo - Go to the Government of British Columbia website"
                priority
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "48px",
                  flex: 1,
                }}
              />
            </HeaderClient>
          </Suspense>
        </Toolbar>
      </AppBar>
    </header>
  );
}