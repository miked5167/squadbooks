'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Phone } from 'lucide-react'
import { EditFamilyDialog } from './EditFamilyDialog'

interface Family {
  id: string
  familyName: string
  primaryName: string | null
  primaryEmail: string
  primaryPhone: string | null
  secondaryName: string | null
  secondaryEmail: string | null
  secondaryPhone: string | null
}

interface FamilyCardProps {
  family: Family
}

export function FamilyCard({ family }: FamilyCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)

  return (
    <>
      <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Family Name */}
            <h3 className="font-semibold text-navy text-lg mb-3">{family.familyName}</h3>

            <div className="space-y-3">
              {/* Primary Guardian */}
              <div className="space-y-1">
                {family.primaryName && (
                  <p className="text-sm font-medium text-navy">
                    {family.primaryName}
                  </p>
                )}
                <div className="flex flex-col gap-1 text-sm text-navy/70">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <a href={`mailto:${family.primaryEmail}`} className="hover:text-navy truncate">
                      {family.primaryEmail}
                    </a>
                  </div>
                  {family.primaryPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <a href={`tel:${family.primaryPhone}`} className="hover:text-navy">
                        {family.primaryPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary Guardian */}
              {(family.secondaryName || family.secondaryEmail || family.secondaryPhone) && (
                <div className="space-y-1 pt-2 border-t border-gray-200">
                  {family.secondaryName && (
                    <p className="text-sm font-medium text-navy">
                      {family.secondaryName}
                    </p>
                  )}
                  <div className="flex flex-col gap-1 text-sm text-navy/70">
                    {family.secondaryEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <a href={`mailto:${family.secondaryEmail}`} className="hover:text-navy truncate">
                          {family.secondaryEmail}
                        </a>
                      </div>
                    )}
                    {family.secondaryPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <a href={`tel:${family.secondaryPhone}`} className="hover:text-navy">
                          {family.secondaryPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-navy/20 text-navy hover:bg-navy/5"
            onClick={() => setIsEditOpen(true)}
          >
            Edit
          </Button>
        </div>
      </div>

      <EditFamilyDialog
        family={family}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </>
  )
}
