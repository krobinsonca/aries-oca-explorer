import React from "react";
import { Typography, Link } from "@mui/material";
import { STATUS, ACTIONS } from "react-joyride";
import { Theme } from "@mui/material/styles";
import dynamic from "next/dynamic";

const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

const demoStates = {
  introSteps: [
    {
      target: "body",
      disableBeacon: true,
      position: "center",
      title: (
        <React.Fragment>
          <Typography variant="h5" component="span">
            What Is OCA Explorer?
          </Typography>
        </React.Fragment>
      ),
      content: (
        <p>
          The OCA Explorer is intended to assist in creating{" "}
          <Link href="https://oca.colossi.network/">
            Overlays Capture Architecture (OCA)
          </Link>{" "}
          bundles and previewing{" "}
          <Link href="https://github.com/swcurran/aries-rfcs/tree/oca4aries/features/0755-oca-for-aries#aries-specific-branding-overlay">
            Branding Overlays
          </Link>
          .
        </p>
      ),
    },
    {
      target: "#overlay-bundle-id",
      position: "center",
      disableBeacon: true,
      title: (
        <React.Fragment>
          <Typography variant="h5" component="span">
            Selecting an OCA Bundle
          </Typography>
        </React.Fragment>
      ),
      content: (
        <p>
          Here you can select a Pre-existing OCA Bundle
        </p>
      ),
    },
    {
      target: "#upload-oca-bundle-button",
      title: (
        <React.Fragment>
          <Typography variant="h5" component="span">
            Uploading a new OCA Bundle
          </Typography>
        </React.Fragment>
      ),
      content: (
        <p>
          If you would like to upload your own OCA Bundle click here
        </p>
      ),
    },
  ],
  brandingSteps: [
    {
      target: "#overlay-bundle-language-select",
      title: (
        <React.Fragment>
          <Typography variant="h5" component="span">
            Previewing Languages
          </Typography>
        </React.Fragment>
      ),
      disableBeacon: true,
      content: (
        <p>
          To preview alternative languages select one of the following radio
          buttons
        </p>
      ),
    },
    {
      target: "#overlay-bundle-credential-card",
      title: (
        <React.Fragment>
          <Typography variant="h5" component="span">
            Credential List Layout
          </Typography>
        </React.Fragment>
      ),
      content: (
        <p>
          This is the current Credential List Layout
        </p>
      ),
    },
    {
      target: "#overlay-bundle-credential-details",
      title: (
        <React.Fragment>
          <Typography variant="h5" component="span">
            Single Credential Layout
          </Typography>
        </React.Fragment>
      ),
      content: (
        <p>
          Here is the current Single Credential Layout
        </p>
      ),
    },
    {
      target: "#overlay-bundle-branding-form-fields",
      title: (
        <React.Fragment>
          <Typography variant="h5" component="span">
            Customizing Branding
          </Typography>
        </React.Fragment>
      ),
      content: (
        <p>
          Here you can customize the branding for your overlay
        </p>
      ),
    },
    {
      target: "#overlay-branding-download-branding-overlay",
      // title: "Download Your Newly Created Branding",
      title: (
        <React.Fragment>
          <Typography variant="h5" component="span">
            Download Your Newly Created Branding
          </Typography>
        </React.Fragment>
      ),
      content: (
        <p>
          Once you are all done you can download your newly created branding.json
        </p>
      ),
    },
  ],
};

export enum DemoState {
  RunningIntro,
  RunningBranding,
  RunningAll,
  PausedDemo,
  SeenDemo,
}

export function Demo({
  runDemo,
  theme,
  resetFunc,
  skipFunc,
}: {
  runDemo: DemoState;
  theme: Theme;
  resetFunc: () => void;
  skipFunc: () => void;
}) {
  const handleJoyrideCallback = (data: any) => {
    const { action, status } = data;
    if (status == STATUS.FINISHED) {
      resetFunc();
    } else if (status == STATUS.SKIPPED || action == ACTIONS.CLOSE) {
      skipFunc();
    }
  };
  const steps = () => {
    switch (runDemo) {
      case DemoState.RunningIntro:
        return demoStates.introSteps;
      case DemoState.RunningBranding:
        return demoStates.brandingSteps;
      case DemoState.RunningAll:
        return [...demoStates.introSteps, ...demoStates.brandingSteps];
      default:
        return [];
    }
  };
  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      locale={{
        back: "Back",
        close: "Close",
        last: "End",
        next: "Next",
        open: "Open the dialog",
        skip: "Skip",
      }}
      hideCloseButton
      scrollToFirstStep
      showSkipButton
      steps={steps()}
      styles={{
        options: {
          arrowColor: "#fff",
          backgroundColor: "#fff",
          primaryColor: theme.palette.primary.dark,
          textColor: theme.palette.primary.main,
          width: 900,
          zIndex: 1000,
        },
      }}
      run={runDemo != DemoState.PausedDemo && runDemo != DemoState.SeenDemo}
    />
  );
}
