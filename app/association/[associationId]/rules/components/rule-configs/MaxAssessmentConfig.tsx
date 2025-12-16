"use client"

import type { UseFormReturn } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { getCurrencySymbol } from "@/lib/utils/currency"

interface MaxAssessmentConfigProps {
  form: UseFormReturn<any>
  currency: string
}

export function MaxAssessmentConfig({ form, currency }: MaxAssessmentConfigProps) {
  const currencySymbol = getCurrencySymbol(currency)

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="config.maxAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Assessment Amount</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {currencySymbol}
                </span>
                <Input
                  type="number"
                  placeholder="1500"
                  className="pl-7"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                    field.onChange(isNaN(value) ? 0 : value)
                  }}
                />
              </div>
            </FormControl>
            <FormDescription>
              The maximum registration fee that can be charged per player (in {currency})
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
