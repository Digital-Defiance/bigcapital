import React from 'react';
import { useHistory } from 'react-router-dom';

import WarehouseTransfersEmptyStatus from './WarehouseTransfersEmptyStatus';

import { DataTable, DashboardContentTable } from 'components';
import { TABLES } from 'common/tables';
import { useMemorizedColumnsWidths } from 'hooks';

import TableSkeletonRows from 'components/Datatable/TableSkeletonRows';
import TableSkeletonHeader from 'components/Datatable/TableHeaderSkeleton';

import withDashboardActions from 'containers/Dashboard/withDashboardActions';
import withWarehouseTransfersActions from './withWarehouseTransfersActions';
import withDrawerActions from 'containers/Drawer/withDrawerActions';
import withDialogActions from 'containers/Dialog/withDialogActions';
import withAlertsActions from 'containers/Alert/withAlertActions';
import withSettings from '../../Settings/withSettings';

import { useWarehouseTransfersTableColumns, ActionsMenu } from './components';
import { useWarehouseTranfersListContext } from './WarehouseTransfersListProvider';

import { compose } from 'utils';

/**
 * Warehouse transfers datatable.
 */
function WarehouseTransfersDataTable({
  // #withWarehouseTransfersActions
  setWarehouseTransferTableState,

  // #withAlertsActions
  openAlert,

  // #withDrawerActions
  openDrawer,

  // #withDialogAction
  openDialog,

  // #withSettings
  warehouseTransferTableSize,
}) {
  const history = useHistory();

  // Warehouse transfers list context.
  const {
    warehousesTransfers,
    pagination,
    isEmptyStatus,
    isWarehouseTransfersLoading,
    isWarehouseTransfersFetching,
  } = useWarehouseTranfersListContext();

  // Invoices table columns.
  const columns = useWarehouseTransfersTableColumns();

  // Local storage memorizing columns widths.
  const [initialColumnsWidths, , handleColumnResizing] =
    useMemorizedColumnsWidths(TABLES.WAREHOUSE_TRANSFERS);

  // Handles fetch data once the table state change.
  const handleDataTableFetchData = React.useCallback(
    ({ pageSize, pageIndex, sortBy }) => {
      setWarehouseTransferTableState({
        pageSize,
        pageIndex,
        sortBy,
      });
    },
    [setWarehouseTransferTableState],
  );

  // Display invoice empty status instead of the table.
  if (isEmptyStatus) {
    return <WarehouseTransfersEmptyStatus />;
  }

  // Handle view detail.
  const handleViewDetailWarehouseTransfer = ({ id }) => {
    openDrawer('warehouse-transfer-detail-drawer', { warehouseTransferId: id });
  };

  // Handle edit warehouse transfer.
  const handleEditWarehouseTransfer = ({ id }) => {
    history.push(`/warehouses-transfers/${id}/edit`);
  };

  // Handle delete warehouse transfer.
  const handleDeleteWarehouseTransfer = ({ id }) => {
    openAlert('warehouse-transfer-delete', { warehouseTransferId: id });
  };

  // Handle cell click.
  const handleCellClick = (cell, event) => {
    openDrawer('warehouse-transfer-detail-drawer', {
      warehouseTransferId: cell.row.original.id,
    });
  };

  return (
    <DashboardContentTable>
      <DataTable
        columns={columns}
        data={warehousesTransfers}
        loading={isWarehouseTransfersLoading}
        headerLoading={isWarehouseTransfersLoading}
        progressBarLoading={isWarehouseTransfersFetching}
        onFetchData={handleDataTableFetchData}
        manualSortBy={true}
        selectionColumn={true}
        noInitialFetch={true}
        sticky={true}
        pagination={true}
        manualPagination={true}
        pagesCount={pagination.pagesCount}
        autoResetSortBy={false}
        autoResetPage={false}
        TableLoadingRenderer={TableSkeletonRows}
        TableHeaderSkeletonRenderer={TableSkeletonHeader}
        ContextMenu={ActionsMenu}
        onCellClick={handleCellClick}
        initialColumnsWidths={initialColumnsWidths}
        onColumnResizing={handleColumnResizing}
        size={warehouseTransferTableSize}
        payload={{
          onViewDetails: handleViewDetailWarehouseTransfer,
          onDelete: handleDeleteWarehouseTransfer,
          onEdit: handleEditWarehouseTransfer,
        }}
      />
    </DashboardContentTable>
  );
}
export default compose(
  withDashboardActions,
  withWarehouseTransfersActions,
  withAlertsActions,
  withDrawerActions,
  withDialogActions,
  withSettings(({ warehouseTransferSettings }) => ({
    warehouseTransferTableSize: warehouseTransferSettings?.tableSize,
  })),
)(WarehouseTransfersDataTable);