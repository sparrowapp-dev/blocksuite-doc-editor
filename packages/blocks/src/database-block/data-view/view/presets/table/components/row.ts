import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { SignalWatcher } from '@lit-labs/preact-signals';
import { css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { DataViewRenderer } from '../../../../data-view.js';
import type { TableSingleView } from '../table-view-manager.js';
import type { TableViewSelection } from '../types.js';

import {
  CenterPeekIcon,
  MoreHorizontalIcon,
} from '../../../../common/icons/index.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../consts.js';
import { openDetail, popRowMenu } from './menu.js';

@customElement('data-view-table-row')
export class TableRow extends SignalWatcher(WithDisposable(ShadowlessElement)) {
  private _clickDragHandler = () => {
    if (this.view.readonly$.value) {
      return;
    }
    const selectionController = this.selectionController;
    if (selectionController) {
      if (
        selectionController.isRowSelected(this.groupKey, this.rowIndex) &&
        selectionController.selection
      ) {
        selectionController.selection = {
          ...selectionController.selection,
          rowsSelection: undefined,
        };
      } else {
        selectionController.selection = {
          groupKey: this.groupKey,
          rowsSelection: {
            start: this.rowIndex,
            end: this.rowIndex,
          },
          focus: {
            rowIndex: this.rowIndex,
            columnIndex: 0,
          },
          isEditing: false,
        };
      }
    }
  };

  static override styles = css`
    .data-view-table-row {
      width: 100%;
    }
    .affine-database-block-row {
      width: 100%;
      display: flex;
      flex-direction: row;
      border-bottom: 1px solid var(--affine-border-color);
      position: relative;
    }

    .affine-database-block-row.selected > .database-cell {
      background: transparent;
    }

    .database-cell {
      min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
    }

    .row-ops {
      position: relative;
      width: 0;
      margin-top: 8px;
      height: max-content;
      visibility: hidden;
      display: flex;
      gap: 4px;
      cursor: pointer;
      justify-content: end;
    }

    .row-op:last-child {
      margin-right: 8px;
    }

    .affine-database-block-row:hover .row-ops {
      visibility: visible;
    }
    .affine-database-block-row .show-on-hover-row {
      visibility: hidden;
      opacity: 0;
      transition: opacity 150ms cubic-bezier(0.42, 0, 1, 1);
    }
    .affine-database-block-row:hover .show-on-hover-row {
      visibility: visible;
      opacity: 1;
    }

    .row-op {
      display: flex;
      padding: 4px;
      border-radius: 4px;
      box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
      background-color: var(--affine-background-primary-color);
      position: relative;
    }

    .row-op:hover:before {
      content: '';
      border-radius: 4px;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background-color: var(--affine-hover-color);
    }

    .row-op svg {
      fill: var(--affine-icon-color);
      color: var(--affine-icon-color);
      width: 16px;
      height: 16px;
    }
  `;

  contextMenu = (e: MouseEvent) => {
    if (this.view.readonly$.value) {
      return;
    }
    const selection = this.selectionController;
    if (!selection) {
      return;
    }
    e.preventDefault();
    const ele = e.target as HTMLElement;
    const cell = ele.closest('affine-database-cell-container');
    const columnIndex = cell?.columnIndex ?? 0;
    selection.selection = {
      groupKey: this.groupKey,
      rowsSelection: {
        start: this.rowIndex,
        end: this.rowIndex,
      },
      focus: {
        rowIndex: this.rowIndex,
        columnIndex: columnIndex,
      },
      isEditing: false,
    };
    const target =
      cell ??
      (e.target as HTMLElement).closest('.database-cell') ?? // for last add btn cell
      (e.target as HTMLElement);

    popRowMenu(this.dataViewEle, target, this.rowId, selection);
  };

  setSelection = (selection?: Omit<TableViewSelection, 'viewId' | 'type'>) => {
    if (this.selectionController) {
      this.selectionController.selection = selection;
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'contextmenu', this.contextMenu);
    // eslint-disable-next-line wc/no-self-class
    this.classList.add('affine-database-block-row', 'database-row');
  }

  protected override render(): unknown {
    const view = this.view;
    return html`
      ${view.readonly$.value
        ? nothing
        : html`<div class="data-view-table-left-bar">
            <div
              class="data-view-table-view-drag-handler"
              @click=${this._clickDragHandler}
              style="width: 8px;height: 100%;display:flex;align-items:center;justify-content:center;cursor:grab;"
            >
              <div
                class="show-on-hover-row"
                style="width: 4px;
            border-radius: 2px;
            height: 12px;
            background-color: var(--affine-placeholder-color);"
              ></div>
            </div>
          </div>`}
      ${repeat(
        view.columnManagerList$.value,
        v => v.id,
        (column, i) => {
          const clickDetail = () => {
            if (!this.selectionController) {
              return;
            }
            this.setSelection({
              groupKey: this.groupKey,
              rowsSelection: {
                start: this.rowIndex,
                end: this.rowIndex,
              },
              focus: {
                rowIndex: this.rowIndex,
                columnIndex: i,
              },
              isEditing: false,
            });
            openDetail(this.dataViewEle, this.rowId, this.selectionController);
          };
          const openMenu = (e: MouseEvent) => {
            if (!this.selectionController) {
              return;
            }
            const ele = e.currentTarget as HTMLElement;
            this.setSelection({
              groupKey: this.groupKey,
              rowsSelection: {
                start: this.rowIndex,
                end: this.rowIndex,
              },
              focus: {
                rowIndex: this.rowIndex,
                columnIndex: i,
              },
              isEditing: false,
            });
            popRowMenu(
              this.dataViewEle,
              ele,
              this.rowId,
              this.selectionController
            );
          };
          return html`
            <div>
              <affine-database-cell-container
                class="database-cell"
                style=${styleMap({
                  width: `${column.width$.value}px`,
                  border: i === 0 ? 'none' : undefined,
                })}
                .view="${view}"
                .column="${column}"
                .rowId="${this.rowId}"
                data-row-id="${this.rowId}"
                .rowIndex="${this.rowIndex}"
                data-row-index="${this.rowIndex}"
                .columnId="${column.id}"
                data-column-id="${column.id}"
                .columnIndex="${i}"
                data-column-index="${i}"
              >
              </affine-database-cell-container>
            </div>
            ${!column.readonly$.value &&
            column.view.header$.value.titleColumn === column.id
              ? html`<div class="row-ops">
                  <div class="row-op" @click="${clickDetail}">
                    ${CenterPeekIcon}
                  </div>
                  ${!view.readonly$.value
                    ? html`<div class="row-op" @click="${openMenu}">
                        ${MoreHorizontalIcon}
                      </div>`
                    : nothing}
                </div>`
              : nothing}
          `;
        }
      )}
      <div class="database-cell add-column-button"></div>
    `;
  }

  get groupKey() {
    return this.closest('affine-data-view-table-group')?.group?.key;
  }

  get selectionController() {
    return this.closest('affine-database-table')?.selectionController;
  }

  @property({ attribute: false })
  accessor dataViewEle!: DataViewRenderer;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor rowIndex!: number;

  @property({ attribute: false })
  accessor view!: TableSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-table-row': TableRow;
  }
}
