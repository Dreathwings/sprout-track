import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import TimePicker from '@/src/components/ui/time-picker';
import { Button } from '@/src/components/ui/button';
import { Calendar as CalendarComponent } from '@/src/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { cn } from '@/src/lib/utils';
import { styles } from './setup-wizard.styles';
import { BabySetupStageProps } from './setup-wizard.types';
import { Gender } from '@prisma/client';
import { useLocalization } from '@/src/context/localization';

/**
 * BabySetupStage Component
 * 
 * Third stage of the setup wizard that collects baby information
 */
const BabySetupStage: React.FC<BabySetupStageProps> = ({
  babyFirstName,
  setBabyFirstName,
  babyLastName,
  setBabyLastName,
  babyBirthDate,
  setBabyBirthDate,
  babyGender,
  setBabyGender,
  feedWarningTime,
  setFeedWarningTime,
  diaperWarningTime,
  setDiaperWarningTime
}) => {
  const { t } = useLocalization();
  
  return (
    <div className={cn(styles.stageContainer, "setup-wizard-stage-container")}>
      <h2 className={cn(styles.stageTitle, "setup-wizard-stage-title")}>
        {t('Add Your Baby')}
      </h2>
      <p className={cn(styles.stageDescription, "setup-wizard-stage-description")}>
        {t('Now let\'s add information about your little one.')}
      </p>
      
      <div className={cn(styles.babyFormGrid, "setup-wizard-baby-form-grid")}>
        <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
          <label 
            className={cn(styles.formLabel, "setup-wizard-form-label")}
            htmlFor="babyFirstName"
          >
            {t('First Name')}
          </label>
          <Input
            id="babyFirstName"
            value={babyFirstName}
            onChange={(e) => setBabyFirstName(e.target.value)}
            placeholder="First name"
            className={cn(styles.formInput, "setup-wizard-form-input")}
          />
        </div>
        <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
          <label 
            className={cn(styles.formLabel, "setup-wizard-form-label")}
            htmlFor="babyLastName"
          >
            {t('Last Name')}
          </label>
          <Input
            id="babyLastName"
            value={babyLastName}
            onChange={(e) => setBabyLastName(e.target.value)}
            placeholder="Last name"
            className={cn(styles.formInput, "setup-wizard-form-input")}
          />
        </div>
      </div>
      
      <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
        <label 
          className={cn(styles.formLabel, "setup-wizard-form-label")}
          htmlFor="babyBirthDate"
        >
          {t('Birth Date')}
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="babyBirthDate"
              variant="input"
              className={cn(
                styles.datePickerButton, 
                "setup-wizard-date-picker-button",
                !babyBirthDate && styles.datePickerPlaceholder,
                !babyBirthDate && "setup-wizard-date-picker-placeholder"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {babyBirthDate ? format(babyBirthDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={babyBirthDate}
              onSelect={setBabyBirthDate}
              maxDate={new Date()} // Can't select future dates
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
        <label 
          className={cn(styles.formLabel, "setup-wizard-form-label")}
          htmlFor="babyGender"
        >
          {t('Gender')}
        </label>
        <Select
          value={babyGender}
          onValueChange={(value) => setBabyGender(value as Gender)}
        >
          <SelectTrigger 
            id="babyGender"
            className={cn(styles.formSelect, "setup-wizard-form-select")}
          >
            <SelectValue placeholder={t('Select gender')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">{t('Male')}</SelectItem>
            <SelectItem value="FEMALE">{t('Female')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className={cn(styles.formGroup, "setup-wizard-form-group", "mt-4")}>
        <p className={cn(styles.formHelperText, "setup-wizard-form-helper-text", "text-sm", "mb-2")}>
          {t('Set the time thresholds when counter bubbles will change from green to red, indicating when a new feeding or diaper change may be needed.')}
        </p>
        
        <div className={cn(styles.babyFormGrid, "setup-wizard-baby-form-grid")}>
          <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
            <label 
              className={cn(styles.formLabel, "setup-wizard-form-label")}
              htmlFor="feedWarningTime"
            >
              {t('Feed Warning Time')}
            </label>
            <TimePicker
              id="feedWarningTime"
              value={feedWarningTime}
              onChange={(value) => setFeedWarningTime(value)}
              className={cn(styles.formInput, "setup-wizard-form-input")}
              ariaLabel={t('baby.warning.feedTimeAriaLabel')}
              required
            />
          </div>
          <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
            <label 
              className={cn(styles.formLabel, "setup-wizard-form-label")}
              htmlFor="diaperWarningTime"
            >
              {t('Diaper Warning Time')}
            </label>
            <TimePicker
              id="diaperWarningTime"
              value={diaperWarningTime}
              onChange={(value) => setDiaperWarningTime(value)}
              className={cn(styles.formInput, "setup-wizard-form-input")}
              ariaLabel={t('baby.warning.diaperTimeAriaLabel')}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BabySetupStage;
