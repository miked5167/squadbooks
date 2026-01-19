import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Info, Mail, Phone, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface TransparencyCardProps {
  treasurerName?: string
  treasurerEmail?: string
  treasurerPhone?: string
}

export function TransparencyCard({
  treasurerName,
  treasurerEmail,
  treasurerPhone,
}: TransparencyCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-navy flex items-center gap-2 font-semibold">
          <Info className="h-4 w-4" />
          Transparency & Help
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Helper Text */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            All financial data is updated in real-time as transactions are approved by your team
            treasurer.
          </p>
        </div>

        {/* Contact Treasurer */}
        <div className="space-y-2">
          <h4 className="text-navy text-sm font-semibold">Questions?</h4>
          {treasurerName || treasurerEmail || treasurerPhone ? (
            <div className="space-y-2">
              {treasurerName && (
                <p className="text-navy/70 text-sm">
                  Contact your team treasurer:
                  <span className="text-navy mt-1 block font-medium">{treasurerName}</span>
                </p>
              )}
              {treasurerEmail && (
                <a
                  href={`mailto:${treasurerEmail}`}
                  className="text-navy hover:text-navy-medium flex items-center gap-2 text-sm transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {treasurerEmail}
                </a>
              )}
              {treasurerPhone && (
                <a
                  href={`tel:${treasurerPhone}`}
                  className="text-navy hover:text-navy-medium flex items-center gap-2 text-sm transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {treasurerPhone}
                </a>
              )}
            </div>
          ) : (
            <p className="text-navy/60 text-sm">
              Contact your team treasurer for questions about specific transactions or the budget.
            </p>
          )}
        </div>

        <Separator className="bg-navy/10" />

        {/* Policy Links */}
        <div className="space-y-2">
          <h4 className="text-navy text-sm font-semibold">Resources</h4>
          <div className="space-y-1">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-navy/70 h-auto w-full justify-start py-2"
            >
              <Link href="/budget">
                <FileText className="mr-2 h-4 w-4" />
                Team Budget
                <ArrowRight className="ml-auto h-3 w-3" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-navy/70 h-auto w-full justify-start py-2"
            >
              <Link href="/transactions">
                <FileText className="mr-2 h-4 w-4" />
                Transaction History
                <ArrowRight className="ml-auto h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Data Freshness Note */}
        <div className="text-navy/50 pt-2 text-center text-xs">
          Data updates automatically when transactions are approved
        </div>
      </CardContent>
    </Card>
  )
}
