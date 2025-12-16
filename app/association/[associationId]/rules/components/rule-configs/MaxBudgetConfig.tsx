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

interface MaxBudgetConfigProps {
  form: UseFormReturn<any>
  currency: string
}

export function MaxBudgetConfig({ form, currency }: MaxBudgetConfigProps) {
  const currencySymbol = getCurrencySymbol(currency)

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="config.maxAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Budget Amount</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {currencySymbol}
                </span>
                <Input
                  type="number"
                  placeholder="20000"
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
              The maximum total budget amount teams can set for the season (in {currency})
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
