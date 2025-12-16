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
import { Switch } from "@/components/ui/switch"
import { getCurrencySymbol } from "@/lib/utils/currency"

interface ZeroBalanceConfigProps {
  form: UseFormReturn<any>
  currency: string
}

export function ZeroBalanceConfig({ form, currency }: ZeroBalanceConfigProps) {
  const currencySymbol = getCurrencySymbol(currency)

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="config.requireBalancedBudget"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require Balanced Budget</FormLabel>
              <FormDescription>
                Teams must ensure their budget balances to zero (income equals expenses)
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="config.tolerance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tolerance Amount</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {currencySymbol}
                </span>
                <Input
                  type="number"
                  placeholder="0"
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
              Acceptable variance from zero in {currency} (e.g., {currencySymbol}10 tolerance means budget can be between -{currencySymbol}10 and +{currencySymbol}10)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
