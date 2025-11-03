import { NextRequest, NextResponse } from 'next/server';

const CANDYSCAN_BASE_URL = 'https://candyscan.idlab.org';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const network = searchParams.get('network');
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';

    if (!network) {
      return NextResponse.json(
        { error: 'Network parameter is required' },
        { status: 400 }
      );
    }

    // Validate network
    const validNetworks = ['CANDY_DEV', 'CANDY_TEST', 'CANDY_PROD'];
    if (!validNetworks.includes(network)) {
      return NextResponse.json(
        { error: `Invalid network. Must be one of: ${validNetworks.join(', ')}` },
        { status: 400 }
      );
    }

    // Build candyscan URL
    const filterTxNames = encodeURIComponent('["SCHEMA","CLAIM_DEF"]');
    const url = `${CANDYSCAN_BASE_URL}/txs/${network}/domain?page=${page}&pageSize=${pageSize}&filterTxNames=${filterTxNames}&sortFromRecent=true`;

    // Fetch from candyscan
    // Create timeout controller for fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Candyscan API error: ${response.status}` },
        { status: response.status }
      );
    }

    // Candyscan returns HTML with JSON embedded in __NEXT_DATA__ script tag
    const html = await response.text();
    
    // Extract JSON from __NEXT_DATA__ script tag
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
    
    if (!nextDataMatch || !nextDataMatch[1]) {
      return NextResponse.json(
        { error: 'Could not extract transaction data from candyscan response' },
        { status: 500 }
      );
    }

    const nextData = JSON.parse(nextDataMatch[1]);
    
    // Extract transactions from the Next.js props
    const transactions = nextData?.props?.pageProps?.indyscanTxs || [];

    // Transform transactions to our format
    const transformedTransactions = transactions.map((tx: any) => {
      const txnMetadata = tx.idata?.txnMetadata || {};
      const txn = tx.idata?.txn || {};
      const txnData = txn.data || {};
      
      return {
        seqNo: txnMetadata.seqNo || 0,
        txType: txn.typeName || txn.type,
        txTime: txnMetadata.txnTime ? Math.floor(new Date(txnMetadata.txnTime).getTime() / 1000) : Date.now(),
        identifier: txnMetadata.txnId || '',
        data: {
          name: txnData.refSchemaName || txnData.data?.name,
          version: txnData.refSchemaVersion || txnData.data?.version,
          schemaId: txnData.refSchemaId,
          ...txnData
        }
      };
    });

    // Return the transformed data with CORS headers
    return NextResponse.json({ transactions: transformedTransactions }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error proxying candyscan request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

