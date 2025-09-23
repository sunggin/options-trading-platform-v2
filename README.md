# Options Trading Platform

A modern web application for tracking stock and options trades with real-time calculations of realized and unrealized gains.

## Features

- 📊 **Trade Input Form**: Easy-to-use form for entering trade data
- 📈 **Dashboard**: Overview of trading statistics and performance metrics
- 💾 **Database View**: Viewable and editable table of all trades
- 🔄 **Real-time Updates**: Automatic calculation of gains and losses
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL commands from `supabase-schema.sql` to create your database tables
4. Go to Settings > API to get your project URL and anon key

### 3. Configure Environment Variables

1. Copy `env.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Schema

The application uses two main tables:

### `accounts`
- `id`: Unique identifier
- `name`: Account name
- `type`: 'paper' or 'live'

### `trades`
- `id`: Unique identifier
- `account`: Account name
- `trading_date`: Date of the trade
- `option_type`: 'call' or 'put'
- `expiration_date`: Option expiration date
- `status`: 'open' or 'closed'
- `contracts`: Number of contracts
- `cost`: Cost per contract
- `strike_price`: Strike price
- `price_at_purchase`: Stock price at purchase
- `realized_gain`: Calculated realized profit/loss
- `unrealized_gain`: Calculated unrealized profit/loss

## Features Overview

### Trade Input Form
- Validates all required fields
- Supports both call and put options
- Tracks open and closed positions
- Automatic form validation with helpful error messages

### Dashboard
- **Total Trades**: Count of all trades
- **Open/Closed Trades**: Breakdown by status
- **Win Rate**: Percentage of profitable trades
- **Realized P&L**: Profit/loss from closed trades
- **Unrealized P&L**: Current profit/loss from open trades
- **Overall P&L**: Combined profit/loss

### Trades Table
- Sortable table view of all trades
- In-line editing capabilities
- Color-coded status indicators
- Real-time profit/loss calculations
- Delete functionality with confirmation

## API Integration

The application includes a framework for market data integration:

- Mock market data service (currently active)
- Ready-to-use examples for Alpha Vantage API
- Extensible for other market data providers

To enable real market data:

1. Get an API key from a provider like Alpha Vantage
2. Add the key to your `.env.local` file
3. Uncomment and configure the real API function in `lib/marketData.ts`

## Customization

### Adding New Fields
1. Update the database schema in `supabase-schema.sql`
2. Update the TypeScript types in `lib/supabase.ts`
3. Add form fields in `components/TradeForm.tsx`
4. Update the table display in `components/TradesTable.tsx`

### Styling
- Uses Tailwind CSS for styling
- Custom color scheme defined in `tailwind.config.js`
- Responsive design with mobile-first approach

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel's dashboard
4. Deploy automatically

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## Learning Resources

Since you're new to coding, here are some helpful resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your Supabase configuration
3. Ensure all environment variables are set correctly
4. Check that the database schema has been applied

## Future Enhancements

Potential features to add:
- User authentication
- Multiple portfolios
- Advanced charting
- Options strategy tracking
- Risk management tools
- Export functionality
- Mobile app

