import React from 'react';
import { Intent } from '@blueprintjs/core';
import { AppToaster } from 'components';
import { formatMessage } from 'services/intl';
import { setWith } from 'lodash';

const ERROR = {
  JOURNAL_NUMBER_ALREADY_EXISTS: 'JOURNAL.NUMBER.ALREADY.EXISTS',
  CUSTOMERS_NOT_WITH_RECEVIABLE_ACC: 'CUSTOMERS.NOT.WITH.RECEIVABLE.ACCOUNT',
  VENDORS_NOT_WITH_PAYABLE_ACCOUNT: 'VENDORS.NOT.WITH.PAYABLE.ACCOUNT',
  PAYABLE_ENTRIES_HAS_NO_VENDORS: 'PAYABLE.ENTRIES.HAS.NO.VENDORS',
  RECEIVABLE_ENTRIES_HAS_NO_CUSTOMERS: 'RECEIVABLE.ENTRIES.HAS.NO.CUSTOMERS',
  CREDIT_DEBIT_SUMATION_SHOULD_NOT_EQUAL_ZERO:
    'CREDIT.DEBIT.SUMATION.SHOULD.NOT.EQUAL.ZERO',
  ENTRIES_SHOULD_ASSIGN_WITH_CONTACT: 'ENTRIES_SHOULD_ASSIGN_WITH_CONTACT',
};

// Transform API errors in toasts messages.
export const transformErrors = (resErrors, { setErrors, errors }) => {
  const getError = (errorType) => resErrors.find((e) => e.type === errorType);
  const toastMessages = [];
  let error;
  let newErrors = { ...errors, entries: [] };

  const setEntriesErrors = (indexes, prop, message) =>
    indexes.forEach((i) => {
      const index = Math.max(i - 1, 0);
      newErrors = setWith(newErrors, `entries.[${index}].${prop}`, message);
    });

  if ((error = getError(ERROR.RECEIVABLE_ENTRIES_HAS_NO_CUSTOMERS))) {
    toastMessages.push(
      formatMessage({
        id: 'should_select_customers_with_entries_have_receivable_account',
      }),
    );
    setEntriesErrors(error.indexes, 'contact_id', 'error');
  }
  if ((error = getError(ERROR.ENTRIES_SHOULD_ASSIGN_WITH_CONTACT))) {
    if (error.meta.contact_type === 'customer') {
      toastMessages.push(
        formatMessage({
          id: 'receivable_accounts_should_assign_with_customers',
        }),
      );
    }
    if (error.meta.contact_type === 'vendor') {
      toastMessages.push(
        formatMessage({ id: 'payable_accounts_should_assign_with_vendors' }),
      );
    }
    setEntriesErrors(error.meta.indexes, 'contact_id', 'error');
  }
  if ((error = getError(ERROR.JOURNAL_NUMBER_ALREADY_EXISTS))) {
    newErrors = setWith(
      newErrors,
      'journal_number',
      formatMessage({
        id: 'journal_number_is_already_used',
      }),
    );
  }
  setErrors({ ...newErrors });

  if (toastMessages.length > 0) {
    AppToaster.show({
      message: toastMessages.map((message) => {
        return <div>- {message}</div>;
      }),
      intent: Intent.DANGER,
    });
  }
};