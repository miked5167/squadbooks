"use client"

import type { UseFormReturn} from "react-hook-form";
import { useFieldArray } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getCurrencySymbol } from "@/lib/utils/currency"

interface ApprovalTiersConfigProps {
  form: UseFormReturn<any>
  currency: string
}

export function ApprovalTiersConfig({ form, currency }: ApprovalTiersConfigProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "approvalTiers",
  })

  const currencySymbol = getCurrencySymbol(currency)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-base font-medium">Approval Tiers</label>
        <p className="text-sm text-muted-foreground">
          Define how many approvals are required based on transaction amounts (in {currency})
        </p>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name={`approvalTiers.${index}.min`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum ({currencySymbol})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                            field.onChange(isNaN(value) ? 0 : value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`approvalTiers.${index}.max`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum ({currencySymbol})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                            field.onChange(isNaN(value) ? 0 : value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`approvalTiers.${index}.approvals`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approvals Required</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value)
                            field.onChange(isNaN(value) ? 0 : value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ min: 0, max: 100, approvals: 1 })}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Tier
      </Button>
    </div>
  )
}
