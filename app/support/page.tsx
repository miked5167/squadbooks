import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle, Book, MessageCircle, Mail, FileText, Video } from 'lucide-react'

export default async function SupportPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-cream">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">Support & Help</h1>
          <p className="text-lg text-navy/70">Get help and learn how to use Squadbooks</p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-card hover:shadow-card-hover transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-meadow/10 rounded-lg flex items-center justify-center mb-3">
                <Book className="w-6 h-6 text-meadow" />
              </div>
              <CardTitle className="text-navy">Documentation</CardTitle>
              <CardDescription>Browse our comprehensive guides and tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-meadow hover:bg-meadow/90 text-white">
                View Docs
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover:shadow-card-hover transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-golden/10 rounded-lg flex items-center justify-center mb-3">
                <Video className="w-6 h-6 text-golden" />
              </div>
              <CardTitle className="text-navy">Video Tutorials</CardTitle>
              <CardDescription>Watch step-by-step video guides</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-golden hover:bg-golden/90 text-navy">
                Watch Videos
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover:shadow-card-hover transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6 text-navy" />
              </div>
              <CardTitle className="text-navy">Live Chat</CardTitle>
              <CardDescription>Chat with our support team in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-navy/20 text-navy hover:bg-navy/5">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover:shadow-card-hover transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-meadow/10 rounded-lg flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-meadow" />
              </div>
              <CardTitle className="text-navy">Email Support</CardTitle>
              <CardDescription>Send us an email and we'll respond within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-navy/20 text-navy hover:bg-navy/5">
                <Mail className="mr-2 w-4 h-4" />
                support@squadbooks.com
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-navy">Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-meadow pl-4">
                <h3 className="font-semibold text-navy mb-2">How do I add a new expense?</h3>
                <p className="text-sm text-navy/70">
                  Click "Add Expense" from the dashboard or navigate to Expenses {">"} New. Fill in the details, upload a receipt, and submit for approval.
                </p>
              </div>

              <div className="border-l-4 border-golden pl-4">
                <h3 className="font-semibold text-navy mb-2">How do budget allocations work?</h3>
                <p className="text-sm text-navy/70">
                  Budget allocations let you set spending limits for different categories like ice time, equipment, and tournaments. View and manage them on the Budget page.
                </p>
              </div>

              <div className="border-l-4 border-navy pl-4">
                <h3 className="font-semibold text-navy mb-2">Who can approve transactions?</h3>
                <p className="text-sm text-navy/70">
                  By default, the team Treasurer and President can approve transactions. You can manage roles and permissions in Settings.
                </p>
              </div>

              <div className="border-l-4 border-meadow pl-4">
                <h3 className="font-semibold text-navy mb-2">How do I export financial reports?</h3>
                <p className="text-sm text-navy/70">
                  Visit the Reports page to generate and export transaction summaries, budget variance reports, and monthly statements in CSV or PDF format.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card className="border-0 shadow-card mt-6 bg-gradient-to-br from-navy to-navy-medium text-white">
          <CardHeader>
            <CardTitle className="text-white">Still need help?</CardTitle>
            <CardDescription className="text-white/80">
              Our team is here to help you get the most out of Squadbooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button className="bg-white text-navy hover:bg-white/90">
                <MessageCircle className="mr-2 w-4 h-4" />
                Contact Support
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <FileText className="mr-2 w-4 h-4" />
                Submit Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
