import { Inject } from 'typedi';
import { difference } from 'lodash';
import * as R from 'ramda';
import {
  EventDispatcher,
  EventDispatcherInterface,
} from 'decorators/eventDispatcher';
import { ServiceError } from 'exceptions';
import {
  IItemCategory,
  IItemCategoryOTD,
  IItemCategoriesService,
  IItemCategoriesFilter,
  ISystemUser,
  IFilterMeta,
} from 'interfaces';
import DynamicListingService from 'services/DynamicListing/DynamicListService';
import TenancyService from 'services/Tenancy/TenancyService';
import events from 'subscribers/events';
import { ACCOUNT_ROOT_TYPE, ACCOUNT_TYPE } from 'data/AccountTypes';

const ERRORS = {
  ITEM_CATEGORIES_NOT_FOUND: 'ITEM_CATEGORIES_NOT_FOUND',
  CATEGORY_NAME_EXISTS: 'CATEGORY_NAME_EXISTS',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  COST_ACCOUNT_NOT_FOUMD: 'COST_ACCOUNT_NOT_FOUMD',
  COST_ACCOUNT_NOT_COGS: 'COST_ACCOUNT_NOT_COGS',
  SELL_ACCOUNT_NOT_INCOME: 'SELL_ACCOUNT_NOT_INCOME',
  SELL_ACCOUNT_NOT_FOUND: 'SELL_ACCOUNT_NOT_FOUND',
  INVENTORY_ACCOUNT_NOT_FOUND: 'INVENTORY_ACCOUNT_NOT_FOUND',
  INVENTORY_ACCOUNT_NOT_INVENTORY: 'INVENTORY_ACCOUNT_NOT_INVENTORY',
  CATEGORY_HAVE_ITEMS: 'CATEGORY_HAVE_ITEMS',
};

export default class ItemCategoriesService implements IItemCategoriesService {
  @Inject()
  tenancy: TenancyService;

  @Inject()
  dynamicListService: DynamicListingService;

  @Inject('logger')
  logger: any;

  @EventDispatcher()
  eventDispatcher: EventDispatcherInterface;

  /**
   * Retrieve item category or throw not found error.
   * @param {number} tenantId
   * @param {number} itemCategoryId
   */
  private async getItemCategoryOrThrowError(
    tenantId: number,
    itemCategoryId: number
  ) {
    const { ItemCategory } = this.tenancy.models(tenantId);
    const category = await ItemCategory.query().findById(itemCategoryId);

    if (!category) {
      throw new ServiceError(ERRORS.CATEGORY_NOT_FOUND);
    }
    return category;
  }

  /**
   * Transforms OTD to model object.
   * @param {IItemCategoryOTD} itemCategoryOTD
   * @param {ISystemUser} authorizedUser
   */
  private transformOTDToObject(
    itemCategoryOTD: IItemCategoryOTD,
    authorizedUser: ISystemUser
  ) {
    return { ...itemCategoryOTD, userId: authorizedUser.id };
  }

  /**
   * Retrieve item category of the given id.
   * @param {number} tenantId -
   * @param {number} itemCategoryId -
   * @returns {IItemCategory}
   */
  public async getItemCategory(
    tenantId: number,
    itemCategoryId: number,
    user: ISystemUser
  ) {
    return this.getItemCategoryOrThrowError(tenantId, itemCategoryId);
  }

  /**
   * Validates the category name uniquiness.
   * @param {number} tenantId - Tenant id.
   * @param {string} categoryName - Category name.
   * @param {number} notAccountId - Ignore the account id.
   */
  private async validateCategoryNameUniquiness(
    tenantId: number,
    categoryName: string,
    notCategoryId?: number
  ) {
    const { ItemCategory } = this.tenancy.models(tenantId);

    this.logger.info('[item_category] validating category name uniquiness.', {
      tenantId,
      categoryName,
      notCategoryId,
    });
    const foundItemCategory = await ItemCategory.query()
      .findOne('name', categoryName)
      .onBuild((query) => {
        if (notCategoryId) {
          query.whereNot('id', notCategoryId);
        }
      });
    if (foundItemCategory) {
      throw new ServiceError(ERRORS.CATEGORY_NAME_EXISTS);
    }
  }

  /**
   * Inserts a new item category.
   * @param {number} tenantId
   * @param {IItemCategoryOTD} itemCategoryOTD
   * @return {Promise<void>}
   */
  public async newItemCategory(
    tenantId: number,
    itemCategoryOTD: IItemCategoryOTD,
    authorizedUser: ISystemUser
  ): Promise<IItemCategory> {
    const { ItemCategory } = this.tenancy.models(tenantId);
    this.logger.info('[item_category] trying to insert a new item category.', {
      tenantId,
    });
    // Validate the category name uniquiness.
    await this.validateCategoryNameUniquiness(tenantId, itemCategoryOTD.name);

    if (itemCategoryOTD.sellAccountId) {
      await this.validateSellAccount(tenantId, itemCategoryOTD.sellAccountId);
    }
    if (itemCategoryOTD.costAccountId) {
      await this.validateCostAccount(tenantId, itemCategoryOTD.costAccountId);
    }
    if (itemCategoryOTD.inventoryAccountId) {
      await this.validateInventoryAccount(
        tenantId,
        itemCategoryOTD.inventoryAccountId
      );
    }

    const itemCategoryObj = this.transformOTDToObject(
      itemCategoryOTD,
      authorizedUser
    );
    const itemCategory = await ItemCategory.query().insert({
      ...itemCategoryObj,
    });

    await this.eventDispatcher.dispatch(events.itemCategory.onCreated);
    this.logger.info('[item_category] item category inserted successfully.', {
      tenantId,
      itemCategoryOTD,
    });

    return itemCategory;
  }

  /**
   * Validates sell account existance and type.
   * @param {number} tenantId - Tenant id.
   * @param {number} sellAccountId - Sell account id.
   * @return {Promise<void>}
   */
  private async validateSellAccount(tenantId: number, sellAccountId: number) {
    const { accountRepository } = this.tenancy.repositories(tenantId);

    this.logger.info('[items] validate sell account existance.', {
      tenantId,
      sellAccountId,
    });
    const foundAccount = await accountRepository.findOneById(sellAccountId);

    if (!foundAccount) {
      this.logger.info('[items] sell account not found.', {
        tenantId,
        sellAccountId,
      });
      throw new ServiceError(ERRORS.SELL_ACCOUNT_NOT_FOUND);
    } else if (!foundAccount.isRootType(ACCOUNT_ROOT_TYPE.INCOME)) {
      this.logger.info('[items] sell account not income type.', {
        tenantId,
        sellAccountId,
      });
      throw new ServiceError(ERRORS.SELL_ACCOUNT_NOT_INCOME);
    }
  }

  /**
   * Validates COGS account existance and type.
   * @param {number} tenantId -
   * @param {number} costAccountId -
   * @return {Promise<void>}
   */
  private async validateCostAccount(tenantId: number, costAccountId: number) {
    const { accountRepository } = this.tenancy.repositories(tenantId);

    this.logger.info('[items] validate cost account existance.', {
      tenantId,
      costAccountId,
    });
    const foundAccount = await accountRepository.findOneById(costAccountId);

    if (!foundAccount) {
      this.logger.info('[items] cost account not found.', {
        tenantId,
        costAccountId,
      });
      throw new ServiceError(ERRORS.COST_ACCOUNT_NOT_FOUMD);
    } else if (!foundAccount.isRootType(ACCOUNT_ROOT_TYPE.EXPENSE)) {
      this.logger.info('[items] validate cost account not COGS type.', {
        tenantId,
        costAccountId,
      });
      throw new ServiceError(ERRORS.COST_ACCOUNT_NOT_COGS);
    }
  }

  /**
   * Validates inventory account existance and type.
   * @param {number} tenantId
   * @param {number} inventoryAccountId
   * @return {Promise<void>}
   */
  private async validateInventoryAccount(
    tenantId: number,
    inventoryAccountId: number
  ) {
    const { accountRepository } = this.tenancy.repositories(tenantId);

    this.logger.info('[items] validate inventory account existance.', {
      tenantId,
      inventoryAccountId,
    });
    const foundAccount = await accountRepository.findOneById(
      inventoryAccountId
    );

    if (!foundAccount) {
      this.logger.info('[items] inventory account not found.', {
        tenantId,
        inventoryAccountId,
      });
      throw new ServiceError(ERRORS.INVENTORY_ACCOUNT_NOT_FOUND);
    } else if (!foundAccount.isAccountType(ACCOUNT_TYPE.INVENTORY)) {
      this.logger.info('[items] inventory account not inventory type.', {
        tenantId,
        inventoryAccountId,
      });
      throw new ServiceError(ERRORS.INVENTORY_ACCOUNT_NOT_INVENTORY);
    }
  }

  /**
   * Edits item category.
   * @param {number} tenantId
   * @param {number} itemCategoryId
   * @param {IItemCategoryOTD} itemCategoryOTD
   * @return {Promise<void>}
   */
  public async editItemCategory(
    tenantId: number,
    itemCategoryId: number,
    itemCategoryOTD: IItemCategoryOTD,
    authorizedUser: ISystemUser
  ): Promise<IItemCategory> {
    const { ItemCategory } = this.tenancy.models(tenantId);
    const oldItemCategory = await this.getItemCategoryOrThrowError(
      tenantId,
      itemCategoryId
    );

    // Validate the category name whether unique on the storage.
    await this.validateCategoryNameUniquiness(
      tenantId,
      itemCategoryOTD.name,
      itemCategoryId
    );
    if (itemCategoryOTD.sellAccountId) {
      await this.validateSellAccount(tenantId, itemCategoryOTD.sellAccountId);
    }
    if (itemCategoryOTD.costAccountId) {
      await this.validateCostAccount(tenantId, itemCategoryOTD.costAccountId);
    }
    if (itemCategoryOTD.inventoryAccountId) {
      await this.validateInventoryAccount(
        tenantId,
        itemCategoryOTD.inventoryAccountId
      );
    }
    const itemCategoryObj = this.transformOTDToObject(
      itemCategoryOTD,
      authorizedUser
    );
    const itemCategory = await ItemCategory.query().patchAndFetchById(
      itemCategoryId,
      { ...itemCategoryObj }
    );

    await this.eventDispatcher.dispatch(events.itemCategory.onEdited);
    this.logger.info('[item_category] edited successfully.', {
      tenantId,
      itemCategoryId,
      itemCategoryOTD,
    });

    return itemCategory;
  }

  /**
   * Deletes the given item category.
   * @param {number} tenantId - Tenant id.
   * @param {number} itemCategoryId - Item category id.
   * @return {Promise<void>}
   */
  public async deleteItemCategory(
    tenantId: number,
    itemCategoryId: number,
    authorizedUser: ISystemUser
  ) {
    this.logger.info('[item_category] trying to delete item category.', {
      tenantId,
      itemCategoryId,
    });

    // Retrieve item category or throw not found error.
    await this.getItemCategoryOrThrowError(tenantId, itemCategoryId);

    // Unassociate items with item category.
    await this.unassociateItemsWithCategories(tenantId, itemCategoryId);

    const { ItemCategory } = this.tenancy.models(tenantId);
    await ItemCategory.query().findById(itemCategoryId).delete();
    this.logger.info('[item_category] deleted successfully.', {
      tenantId,
      itemCategoryId,
    });

    await this.eventDispatcher.dispatch(events.itemCategory.onDeleted);
  }

  /**
   * Retrieve item categories or throw not found error.
   * @param {number} tenantId
   * @param {number[]} itemCategoriesIds
   */
  private async getItemCategoriesOrThrowError(
    tenantId: number,
    itemCategoriesIds: number[]
  ) {
    const { ItemCategory } = this.tenancy.models(tenantId);
    const itemCategories = await ItemCategory.query().whereIn(
      'id',
      itemCategoriesIds
    );

    const storedItemCategoriesIds = itemCategories.map(
      (category: IItemCategory) => category.id
    );
    const notFoundCategories = difference(
      itemCategoriesIds,
      storedItemCategoriesIds
    );

    if (notFoundCategories.length > 0) {
      throw new ServiceError(ERRORS.ITEM_CATEGORIES_NOT_FOUND);
    }
  }

  /**
   * Parses items categories filter DTO.
   * @param {} filterDTO 
   * @returns 
   */
  private parsesListFilterDTO(filterDTO) {
    return R.compose(
      // Parses stringified filter roles.
      this.dynamicListService.parseStringifiedFilter,
    )(filterDTO);
  }

  /**
   * Retrieve item categories list.
   * @param {number} tenantId
   * @param filter
   */
  public async getItemCategoriesList(
    tenantId: number,
    filterDTO: IItemCategoriesFilter,
    authorizedUser: ISystemUser
  ): Promise<{ itemCategories: IItemCategory[]; filterMeta: IFilterMeta }> {
    const { ItemCategory } = this.tenancy.models(tenantId);

    // Parses list filter DTO.
    const filter = this.parsesListFilterDTO(filterDTO);

    // Dynamic list service.
    const dynamicList = await this.dynamicListService.dynamicList(
      tenantId,
      ItemCategory,
      filter
    );

    const itemCategories = await ItemCategory.query().onBuild((query) => {
      // Subquery to calculate sumation of assocaited items to the item category.
      query.select('*', ItemCategory.relatedQuery('items').count().as('count'));

      dynamicList.buildQuery()(query);
    });
    return { itemCategories, filterMeta: dynamicList.getResponseMeta() };
  }

  /**
   * Unlink items relations with item categories.
   * @param {number} tenantId
   * @param {number|number[]} itemCategoryId -
   * @return {Promise<void>}
   */
  private async unassociateItemsWithCategories(
    tenantId: number,
    itemCategoryId: number | number[]
  ): Promise<void> {
    const { Item } = this.tenancy.models(tenantId);
    const ids = Array.isArray(itemCategoryId)
      ? itemCategoryId
      : [itemCategoryId];

    await Item.query().whereIn('category_id', ids).patch({ category_id: null });
  }

  /**
   * Deletes item categories in bulk.
   * @param {number} tenantId
   * @param {number[]} itemCategoriesIds
   */
  public async deleteItemCategories(
    tenantId: number,
    itemCategoriesIds: number[],
    authorizedUser: ISystemUser
  ) {
    this.logger.info('[item_category] trying to delete item categories.', {
      tenantId,
      itemCategoriesIds,
    });
    const { ItemCategory } = this.tenancy.models(tenantId);

    await this.getItemCategoriesOrThrowError(tenantId, itemCategoriesIds);
    await this.unassociateItemsWithCategories(tenantId, itemCategoriesIds);

    await ItemCategory.query().whereIn('id', itemCategoriesIds).delete();

    await this.eventDispatcher.dispatch(events.itemCategory.onBulkDeleted);
    this.logger.info('[item_category] item categories deleted successfully.', {
      tenantId,
      itemCategoriesIds,
    });
  }
}
