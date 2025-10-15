import Link from 'next/link';
import { Box, Typography, Button, Container } from '@mui/material';
import Header from '@/app/components/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="50vh" 
          gap={3}
          textAlign="center"
        >
          <Typography variant="h1" color="primary" sx={{ fontSize: '4rem', fontWeight: 'bold' }}>
            404
          </Typography>
          <Typography variant="h4" gutterBottom>
            Credential Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
            The credential you're looking for doesn't exist or may have been removed. 
            This could happen if the credential ID has changed or if there was an issue 
            loading the credential data.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Link href="/" passHref>
              <Button variant="contained" size="large">
                Back to Credential Explorer
              </Button>
            </Link>
          </Box>
        </Box>
      </Container>
    </>
  );
}
