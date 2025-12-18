# GENR8

An open-source AI generation platform that kills subscriptions. Pay only for what you create with $GENR8 tokens on Solana.

## Features

- **Pay-per-use**: No subscriptions, no monthly fees. Pay only when you generate
- **Multiple AI Models**: Access to top AI models in one place:
  - **Images**: GPT-4o Image, Ideogram V3, Qwen
  - **Videos**: Sora 2, Veo 3.1
- **Solana Payments**: Pay with $GENR8 tokens or USDC on Solana
- **Prompt Optimizer**: AI-powered prompt enhancement (free for token holders)
- **Real-time Generation**: Track progress and get results instantly
- **Chat Interface**: Organized chat sessions for your generations

## How It Works

1. Connect your Solana wallet (Phantom, Solflare, etc.)
2. Choose a model and enter your prompt
3. Pay per generation with $GENR8 tokens
4. Get your content - full ownership, no watermarks

## Tech Stack

- **Framework**: Next.js 14
- **Blockchain**: Solana (SPL Tokens, Token-2022)
- **Styling**: Tailwind CSS
- **Storage**: Supabase
- **AI APIs**: OpenAI, Ideogram, Qwen, Kie.ai, Veo

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Solana wallet
- Supabase account (for storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/genr8.git
cd genr8

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PAYMENT_TOKEN_MINT_ADDRESS=your_token_mint_address
PAYMENT_WALLET_ADDRESS=your_payment_wallet_address

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI APIs
OPENAI_API_KEY=your_openai_api_key
IMAGE_4O_API_KEY=your_kie_ai_api_key
IDEOGRAM_API_KEY=your_ideogram_api_key
QWEN_API_KEY=your_qwen_api_key

# Model Prices (optional, defaults provided)
PRICE_IMAGE_GPT=0.042
PRICE_IMAGE_IDEOGRAM=0.066
PRICE_IMAGE_QWEN=0.03
PRICE_VIDEO_SORA_2=0.21
PRICE_VIDEO_VEO_3_1=0.36
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
genr8/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── generate/      # Generation endpoints
│   │   ├── payment/       # Payment verification
│   │   └── optimize-prompt/ # Prompt optimization
│   ├── dashboard/         # Main dashboard
│   ├── promptoptimizer/   # Prompt optimizer page
│   └── ...
├── components/            # React components
│   ├── ChatDashboard.tsx  # Main chat interface
│   ├── PaymentModal.tsx   # Payment handling
│   └── ...
├── lib/                   # Utilities and integrations
│   ├── solana-payment.ts  # Solana payment logic
│   ├── models.ts          # AI model definitions
│   └── ...
└── public/               # Static assets
```

## Payment Flow

1. User selects a model and enters prompt
2. System returns HTTP 402 Payment Required with amount
3. User pays with $GENR8 tokens via Solana transaction
4. Payment signature is verified on-chain
5. Generation starts after payment confirmation

## Token Gating

Some features require holding minimum token amounts:
- **Prompt Optimizer**: 100,000 $GENR8 tokens

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See [LICENSE](LICENSE) file for details.

## Links

- Website: [genr8.app](https://genr8.app)
- Twitter: [@GENR8APP](https://x.com/GENR8APP)
