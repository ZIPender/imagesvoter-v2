import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Camera, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI vs Real Contest</h1>
            </div>
            <Link href="/auth/signin">
              <Button variant="outline" size="sm">Teacher Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center py-16 lg:py-24">
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            AI vs Real
            <span className="block text-blue-600">Image Contest</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            Interactive classroom platform where students submit AI and real images, then vote for the best pairs.
          </p>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Teacher Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">For Teachers</CardTitle>
                <CardDescription className="text-base">
                  Create and manage classroom contests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Create unlimited classrooms
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Manage contest phases
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    View real-time results
                  </div>
                </div>
                <div className="space-y-3">
                  <Link href="/auth/signin" className="block">
                    <Button className="w-full group-hover:bg-blue-700 transition-colors">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="block">
                    <Button variant="outline" className="w-full">Create Account</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Student Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">For Students</CardTitle>
                <CardDescription className="text-base">
                  Join contests and vote for the best images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    No account required
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Join with 6-digit code
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Submit & vote for images
                  </div>
                </div>
                <Link href="/join" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700 group-hover:bg-green-700 transition-colors">
                    Join Contest
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How it works */}
        <div className="py-16 border-t border-gray-200">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">How it works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Camera className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">1. Submit Images</h4>
              <p className="text-gray-600">
                Students upload one AI-generated and one real image
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">2. Vote Anonymously</h4>
              <p className="text-gray-600">
                Everyone votes for their favorite image pairs
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="text-yellow-600 font-bold text-lg">🏆</div>
              </div>
              <h4 className="text-lg font-semibold mb-2">3. See Results</h4>
              <p className="text-gray-600">
                View live results and celebrate the winners
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">
            AI vs Real Image Contest Platform - Built for Educational Use
          </p>
        </div>
      </footer>
    </div>
  );
}
