'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface StepAssociationBasicsProps {
  onComplete: (data: AssociationBasicsData) => void;
  initialData?: Partial<AssociationBasicsData>;
}

interface AssociationBasicsData {
  name: string;
  abbreviation?: string;
  provinceState?: string;
  country?: string;
  currency: string;
  season?: string;
  logoUrl?: string;
}

interface FieldErrors {
  name?: string;
  currency?: string;
  season?: string;
}

const COUNTRIES = [
  { value: 'CA', label: 'Canada', currency: 'CAD' },
  { value: 'US', label: 'United States', currency: 'USD' },
];

const CANADIAN_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon'
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const getCurrentSeason = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // If before September, use previous year as start
  if (month < 8) {
    return `${year - 1}-${year}`;
  }
  return `${year}-${year + 1}`;
};

export function StepAssociationBasics({ onComplete, initialData }: StepAssociationBasicsProps) {
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    abbreviation: initialData?.abbreviation || '',
    provinceState: initialData?.provinceState || '',
    country: initialData?.country || 'CA',
    currency: initialData?.currency || 'CAD',
    season: initialData?.season || getCurrentSeason(),
    logoUrl: initialData?.logoUrl || '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select currency based on country
  useEffect(() => {
    const selectedCountry = COUNTRIES.find(c => c.value === formData.country);
    if (selectedCountry && formData.currency !== selectedCountry.currency) {
      setFormData(prev => ({ ...prev, currency: selectedCountry.currency }));
    }
  }, [formData.country]);

  const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Please enter your association name';
        if (value.trim().length < 3) return 'Association name must be at least 3 characters';
        if (value.trim().length > 100) return 'Association name must be less than 100 characters';
        break;
      case 'currency':
        if (!value) return 'Please select a currency';
        break;
      case 'season':
        if (value && !/^\d{4}-\d{4}$/.test(value.trim())) {
          return 'Season should be in format: 2025-2026';
        }
        break;
    }
    return undefined;
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof FieldErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    const newErrors: FieldErrors = {};
    newErrors.name = validateField('name', formData.name);
    newErrors.currency = validateField('currency', formData.currency);
    if (formData.season) {
      newErrors.season = validateField('season', formData.season);
    }

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    onComplete(formData);
  };

  const getProvinceStateOptions = () => {
    return formData.country === 'CA' ? CANADIAN_PROVINCES : US_STATES;
  };

  const getProvinceStateLabel = () => {
    return formData.country === 'CA' ? 'Province/Territory' : 'State';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-golden to-meadow rounded-2xl mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-display-3 font-bold text-navy mb-2">
          Association Basics
        </h1>
        <p className="text-navy/70">
          Tell us about your association so we can set up your command center
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Association Name */}
            <div>
              <Label htmlFor="name" className="required">
                Association Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g., Newmarket Minor Hockey Association"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Abbreviation */}
            <div>
              <Label htmlFor="abbreviation">
                Abbreviation (Optional)
              </Label>
              <Input
                id="abbreviation"
                type="text"
                value={formData.abbreviation}
                onChange={(e) => handleFieldChange('abbreviation', e.target.value)}
                placeholder="e.g., NMHA"
                maxLength={10}
              />
              <p className="text-xs text-navy/60 mt-1">
                Short form of your association name (10 characters max)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country */}
              <div>
                <Label htmlFor="country">Country</Label>
                {mounted ? (
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleFieldChange('country', value)}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input disabled value={formData.country} />
                )}
              </div>

              {/* Province/State */}
              <div>
                <Label htmlFor="provinceState">{getProvinceStateLabel()} (Optional)</Label>
                {mounted ? (
                  <Select
                    value={formData.provinceState}
                    onValueChange={(value) => handleFieldChange('provinceState', value)}
                  >
                    <SelectTrigger id="provinceState">
                      <SelectValue placeholder={`Select ${getProvinceStateLabel().toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getProvinceStateOptions().map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input disabled value={formData.provinceState} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Currency */}
              <div>
                <Label htmlFor="currency" className="required">
                  Currency
                </Label>
                {mounted ? (
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleFieldChange('currency', value)}
                  >
                    <SelectTrigger id="currency" className={errors.currency ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input disabled value={formData.currency} />
                )}
                {errors.currency && (
                  <p className="text-sm text-red-500 mt-1">{errors.currency}</p>
                )}
              </div>

              {/* Season */}
              <div>
                <Label htmlFor="season">
                  Season (Optional)
                </Label>
                <Input
                  id="season"
                  type="text"
                  value={formData.season}
                  onChange={(e) => handleFieldChange('season', e.target.value)}
                  placeholder="e.g., 2025-2026"
                  className={errors.season ? 'border-red-500' : ''}
                />
                {errors.season && (
                  <p className="text-sm text-red-500 mt-1">{errors.season}</p>
                )}
              </div>
            </div>

            {/* Logo URL */}
            <div>
              <Label htmlFor="logoUrl">
                Logo URL (Optional)
              </Label>
              <Input
                id="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-navy/60 mt-1">
                URL to your association&apos;s logo image
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
