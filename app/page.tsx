"use client";

import Form from './components/Form'
import OverlayForm from './components/OverlayForm'
import { useCallback, useEffect, useState } from 'react';
import {
  CredentialExchangeRecord,
  CredentialPreviewAttribute,
  CredentialState,
} from "@aries-framework/core";
import { OverlayBundle } from '@hyperledger/aries-oca/build/types';
import theme from './theme';
import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import Header from './components/Header';
import { Demo, DemoState } from './components/Demo';

export default function Home() {
  const [overlayData, setOverlayData] = useState<{
    overlay: OverlayBundle | undefined;
    record: CredentialExchangeRecord | undefined;
  }>({ overlay: undefined, record: undefined });
  const [initStore, setInitStore] = useState<string | null>(null);
  const [demoState, setDemoState] = useState<DemoState>(
    initStore != null && initStore != DemoState.PausedDemo.toString()
      ? parseInt(initStore)
      : DemoState.RunningIntro
  );

  useEffect(() => {
    // Track if we should skip the rest of the demo.
    const initStore = localStorage.getItem("OCAExplorerSeenDemo");
    setInitStore(initStore);
  }, []);

  useEffect(() => {
    // Update localStorage to reflect the skipDemo state
    localStorage.setItem("OCAExplorerSeenDemo", demoState.toString());
  }, [demoState]);

  const handleOverlayData = useCallback(
    (overlayData: {
      overlay: OverlayBundle | undefined;
      data: Record<string, string>;
    }) => {
      const record = new CredentialExchangeRecord({
        threadId: "123",
        protocolVersion: "1.0",
        state: CredentialState.OfferReceived,
        credentialAttributes: Object.entries(overlayData.data).map(
          ([name, value]) => new CredentialPreviewAttribute({ name, value })
        ),
      });
      setOverlayData({ ...overlayData, record });
      if (demoState != DemoState.SeenDemo) {
        setDemoState(DemoState.RunningBranding);
      }
    },
    [demoState]
  );

  return (
    <StyledEngineProvider injectFirst>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <Demo
          runDemo={demoState}
          theme={theme}
          resetFunc={() =>
            setDemoState(
              overlayData?.overlay ? DemoState.SeenDemo : DemoState.PausedDemo
            )
          }
          skipFunc={() => setDemoState(DemoState.SeenDemo)}
        />
        <header>
          <Header
            callback={() =>
              setDemoState(
                overlayData?.overlay
                  ? DemoState.RunningAll
                  : DemoState.RunningIntro
              )
            }
          />
        </header>
        <main className='app min-h-screen'>
          <Form onOverlayData={handleOverlayData} />
          {overlayData?.overlay && (
            <OverlayForm
              overlay={overlayData.overlay}
              record={overlayData.record}
            />
          )}
        </main>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
