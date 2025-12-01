"use client"

import { UseFormReturn, useFieldArray } from "react-hook-form"
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
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface RequiredExpensesConfigProps {
  form: UseFormReturn<any>
}

export function RequiredExpensesConfig({ form }: RequiredExpensesConfigProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requiredExpenses",
  })

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="config.enforceStrict"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Strict Enforcement</FormLabel>
              <FormDescription>
                Prevent budget creation if required categories are missing
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

      <div>
        <label className="text-base font-medium">Required Categories</label>
        <p className="text-sm text-muted-foreground">
          Expense categories that must be included in every team budget
        </p>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name={`requiredExpenses.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Ice Rental, Referee Fees"
                          {...field}
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
        onClick={() => append("")}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Category
      </Button>
    </div>
  )
}
