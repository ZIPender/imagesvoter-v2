# AI vs Real Image Contest Platform

A modern web application for classroom image-based contests where students compete by submitting AI-generated and real images, then vote for the best pairs.

## Features

### For Teachers
- **Account Management**: Create and manage teacher accounts
- **Classroom Creation**: Organize contests within classrooms
- **Contest Management**: Create contests with unique join codes
- **Real-time Monitoring**: Track participant activity and submissions
- **Phase Control**: Manage contest phases (Submission → Voting → Results)
- **Live Dashboard**: View real-time statistics and progress

### For Students
- **Easy Joining**: Join contests with 6-digit codes
- **Anonymous Participation**: No account required, just a nickname
- **Image Submission**: Upload AI-generated and real image pairs
- **Voting System**: Vote for the best image pairs anonymously
- **Live Results**: See contest results in real-time

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI components
- **Database**: SQLite with Prisma ORM
- **Authentication**: Custom JWT-like token system
- **File Handling**: Built-in Next.js API routes
- **Real-time Updates**: Polling-based updates

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cg-imagesvoter-v3
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your configuration
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Initialize the database:
```bash
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Teacher Workflow

1. **Create Account**: Visit `/auth/signup` to create a teacher account
2. **Sign In**: Use `/auth/signin` to access the dashboard
3. **Create Classroom**: From the dashboard, create a new classroom
4. **Create Contest**: Create a contest within a classroom
5. **Share Join Code**: Give students the 6-digit join code
6. **Manage Contest**: Use the management interface to control contest phases
7. **Monitor Progress**: Watch real-time participant activity and submissions
8. **Control Phases**: Move from Submission → Voting → Results as needed

### Student Workflow

1. **Join Contest**: Visit `/join` and enter the 6-digit code + nickname
2. **Submit Images**: Upload one AI-generated and one real image
3. **Wait for Voting**: Teacher will start the voting phase
4. **Vote**: Choose the best image pair from other participants
5. **View Results**: See the final results and winner

## Contest Phases

1. **SUBMISSION**: Students can join and submit image pairs
2. **VOTING**: Students vote for the best submissions (no new participants)
3. **RESULTS**: Display final results with vote counts and winner
4. **ENDED**: Contest is concluded

## API Routes

### Authentication
- `POST /api/auth/signup` - Create teacher account
- `POST /api/auth/signin` - Teacher login

### Classrooms
- `GET /api/classrooms` - List teacher's classrooms
- `POST /api/classrooms` - Create new classroom

### Contests
- `GET /api/contests` - List teacher's contests
- `POST /api/contests` - Create new contest
- `GET /api/contest/[id]` - Get contest data (student view)
- `GET /api/contest/[id]/manage` - Get contest management data (teacher)
- `PATCH /api/contest/[id]/status` - Update contest status (teacher)

### Participation
- `POST /api/contest/join` - Join contest with code
- `POST /api/contest/[id]/submit` - Submit image pair
- `POST /api/contest/[id]/vote` - Submit vote

## Database Schema

The application uses the following main entities:

- **User**: Teacher accounts
- **Classroom**: Organizational units for contests
- **Contest**: Individual contest instances
- **Participant**: Students who joined a contest
- **Submission**: Image pairs submitted by participants
- **Vote**: Votes cast by participants

## Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── contest/        # Contest pages
│   ├── dashboard/      # Teacher dashboard
│   └── join/           # Student join page
├── components/         # Reusable UI components
│   └── ui/            # Shadcn UI components
├── lib/               # Utility functions and database
└── types/             # TypeScript type definitions
```

### Key Components
- **Dashboard**: Teacher's main interface
- **Contest Management**: Real-time contest control
- **Contest Participation**: Student contest interface
- **Join Flow**: Student onboarding

### Database Commands
```bash
# Push schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio
```

## Features in Detail

### Real-time Updates
- Dashboard polls every 5 seconds for live data
- Participant status updates automatically
- Vote counts update in real-time during results phase

### Security
- Teacher authentication with token-based system
- Session-based participant tracking
- Contest ownership verification
- Input validation and sanitization

### User Experience
- Responsive design for all screen sizes
- Loading states and error handling
- Toast notifications for user feedback
- Intuitive phase transitions

## Deployment

For production deployment:

1. Set up a production database (PostgreSQL recommended)
2. Update environment variables
3. Build the application: `npm run build`
4. Deploy to your preferred platform (Vercel, Railway, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository or contact the development team.
