import React from 'react';
import {
  InputGroup,
  FormGroup,
  Position,
  ControlGroup,
  Classes,
} from '@blueprintjs/core';
import { FastField, ErrorMessage } from 'formik';
import { DateInput } from '@blueprintjs/datetime';
import { FormattedMessage as T } from 'components';
import classNames from 'classnames';

import { CLASSES } from 'common/classes';
import { journalTypes } from '../../../common/journalTypes';
import { FFormGroup } from '../../../components';
import {
  momentFormatter,
  compose,
  inputIntent,
  handleDateChange,
  tansformDateValue,
} from 'utils';
import {
  Hint,
  FieldHint,
  FieldRequiredHint,
  Icon,
  InputPrependButton,
  CurrencySelectList,
} from 'components';
import withSettings from 'containers/Settings/withSettings';
import { useMakeJournalFormContext } from './MakeJournalProvider';
import { JournalExchangeRateInputField, JournalTypeSelect } from './components';
import withDialogActions from 'containers/Dialog/withDialogActions';
import {
  currenciesFieldShouldUpdate,
  useObserveJournalNoSettings,
} from './utils';

/**
 * Make journal entries header.
 */
function MakeJournalEntriesHeader({
  // #ownProps
  onJournalNumberChanged,

  // #withDialog
  openDialog,

  // #withSettings
  journalAutoIncrement,
  journalNextNumber,
  journalNumberPrefix,
}) {
  const { currencies } = useMakeJournalFormContext();

  // Handle journal number change.
  const handleJournalNumberChange = () => {
    openDialog('journal-number-form');
  };

  // Handle journal number blur.
  const handleJournalNoBlur = (form, field) => (event) => {
    const newValue = event.target.value;

    if (field.value !== newValue && journalAutoIncrement) {
      openDialog('journal-number-form', {
        initialFormValues: {
          manualTransactionNo: newValue,
          incrementMode: 'manual-transaction',
        },
      });
    }
  };

  useObserveJournalNoSettings(journalNumberPrefix, journalNextNumber);

  return (
    <div className={classNames(CLASSES.PAGE_FORM_HEADER_FIELDS)}>
      {/*------------ Posting date -----------*/}
      <FastField name={'date'}>
        {({ form, field: { value }, meta: { error, touched } }) => (
          <FormGroup
            label={<T id={'posting_date'} />}
            labelInfo={<FieldRequiredHint />}
            intent={inputIntent({ error, touched })}
            helperText={<ErrorMessage name="date" />}
            minimal={true}
            inline={true}
            className={classNames(CLASSES.FILL)}
          >
            <DateInput
              {...momentFormatter('YYYY/MM/DD')}
              onChange={handleDateChange((formattedDate) => {
                form.setFieldValue('date', formattedDate);
              })}
              value={tansformDateValue(value)}
              popoverProps={{
                position: Position.BOTTOM,
                minimal: true,
              }}
              inputProps={{
                leftIcon: <Icon icon={'date-range'} />,
              }}
            />
          </FormGroup>
        )}
      </FastField>

      {/*------------ Journal number -----------*/}
      <FastField name={'journal_number'}>
        {({ form, field, meta: { error, touched } }) => (
          <FormGroup
            label={<T id={'journal_no'} />}
            labelInfo={
              <>
                <FieldRequiredHint />
                <FieldHint />
              </>
            }
            className={'form-group--journal-number'}
            intent={inputIntent({ error, touched })}
            helperText={<ErrorMessage name="journal_number" />}
            fill={true}
            inline={true}
          >
            <ControlGroup fill={true}>
              <InputGroup
                fill={true}
                value={field.value}
                asyncControl={true}
                onBlur={handleJournalNoBlur(form, field)}
              />
              <InputPrependButton
                buttonProps={{
                  onClick: handleJournalNumberChange,
                  icon: <Icon icon={'settings-18'} />,
                }}
                tooltip={true}
                tooltipProps={{
                  content: (
                    <T id={'setting_your_auto_generated_journal_number'} />
                  ),
                  position: Position.BOTTOM_LEFT,
                }}
              />
            </ControlGroup>
          </FormGroup>
        )}
      </FastField>

      {/*------------ Reference -----------*/}
      <FastField name={'reference'}>
        {({ form, field, meta: { error, touched } }) => (
          <FormGroup
            label={<T id={'reference'} />}
            labelInfo={
              <Hint
                content={<T id={'journal_reference_hint'} />}
                position={Position.RIGHT}
              />
            }
            className={'form-group--reference'}
            intent={inputIntent({ error, touched })}
            helperText={<ErrorMessage name="reference" />}
            fill={true}
            inline={true}
          >
            <InputGroup fill={true} {...field} />
          </FormGroup>
        )}
      </FastField>

      {/*------------ Journal type  -----------*/}
      <FFormGroup
        name={'journal_type'}
        label={<T id={'journal_type'} />}
        inline={true}
        className={classNames('form-group--select-list', Classes.FILL)}
      >
        <JournalTypeSelect
          items={journalTypes}
          name={'journal_type'}
          popoverProps={{ minimal: true }}
        />
      </FFormGroup>

      {/*------------ Currency  -----------*/}
      <FastField
        name={'currency_code'}
        currencies={currencies}
        shouldUpdate={currenciesFieldShouldUpdate}
      >
        {({ form, field: { value }, meta: { error, touched } }) => (
          <FormGroup
            label={<T id={'currency'} />}
            className={classNames('form-group--currency', CLASSES.FILL)}
            inline={true}
          >
            <CurrencySelectList
              currenciesList={currencies}
              selectedCurrencyCode={value}
              onCurrencySelected={(currencyItem) => {
                form.setFieldValue('currency_code', currencyItem.currency_code);
                form.setFieldValue('exchange_rate', '');
              }}
              defaultSelectText={value}
            />
          </FormGroup>
        )}
      </FastField>

      {/* ----------- Exchange rate ----------- */}
      <JournalExchangeRateInputField
        name={'exchange_rate'}
        formGroupProps={{ label: ' ', inline: true }}
      />
    </div>
  );
}

export default compose(
  withDialogActions,
  withSettings(({ manualJournalsSettings }) => ({
    journalAutoIncrement: manualJournalsSettings?.autoIncrement,
    journalNextNumber: manualJournalsSettings?.nextNumber,
    journalNumberPrefix: manualJournalsSettings?.numberPrefix,
  })),
)(MakeJournalEntriesHeader);
