import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Ledes98BInvoiceServiceProxy, LEDES98BInvoiceListDto, CreateLEDES98BInvoiceInput, MatterServiceProxy, MatterListDto, } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { LazyLoadEvent } from 'primeng/primeng';
import { Table } from 'primeng/components/table/table';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Router } from '@angular/router';

@Component({
    selector: 'ledes-invoice',
    templateUrl: './ledes.component.html',
    animations: [appModuleAnimation()]
})
export class LedesComponent extends AppComponentBase implements OnInit {


    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;


    invoices: LEDES98BInvoiceListDto[];
    ledes: CreateLEDES98BInvoiceInput;
    filter: string;
    hostUrl: string;
    creationUserId: number;
    selectedMatter = -1;
    matters: MatterListDto[] = [];
    columns = [];
    statusClass = {
        'Approved': 'm-badge--success',
        'Pending': 'm-badge--brand',
        'Rejected': 'm-badge--danger'
    };



    constructor(injector: Injector,
        private _ledesService: Ledes98BInvoiceServiceProxy,
        private _matterService: MatterServiceProxy,
        private _router: Router
    ) {
        super(injector);
        this.ledes = new CreateLEDES98BInvoiceInput();
        this.invoices = [];
        this.filter = '';
        this.hostUrl = AppConsts.remoteServiceBaseUrl + '/LEDES/';

        this.columns = [
            { field: 'name', header: 'Invoice Name' },
            { field: 'invoiceNumber', header: 'Invoice Number' },
            { field: 'matterId', header: 'Matter Name' },
            { field: 'revisionStatus', header: 'Status' },
            { field: 'creationTime', header: 'Upload Time' },
        ];
    }

    ngOnInit(): void {
        this.selectedMatter = null;
        // get matters
        this._matterService.getMattersPaging('', 0, '', 1000, 0).subscribe(result => {
            this.matters = result.items;
        });
    }
    getMatterName(id) {
        let matter = this.matters.find((m) => {
            return m.id === id;
        });
        matter = matter || new MatterListDto();
        return matter.clientMatterName;
    }

    deleteLEDES(ledes: LEDES98BInvoiceListDto): void {
        this.message.confirm(
            this.l('DeleteLedes98BInvoiceWarning', ledes.name), isConfirm => {
                if (isConfirm) {
                    this._ledesService.deleteLEDES98BInvoice(ledes.id)
                        .subscribe(() => {
                            this.notify.info(this.l('SuccessfullyDeleted'));
                            this.reloadPage();
                        });
                }
            }
        );
    }

    getLEDES(event?: LazyLoadEvent): void {

        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            return;
        }

        this.primengTableHelper.showLoadingIndicator();

        this._ledesService.getLEDES98BInvoice(
            this.filter,
            this.selectedMatter || -1,
            this.primengTableHelper.getSorting(this.dataTable),
            this.primengTableHelper.getMaxResultCount(this.paginator, event),
            this.primengTableHelper.getSkipCount(this.paginator, event)
        ).subscribe((result) => {
            this.primengTableHelper.records = result.items;
            this.primengTableHelper.totalRecordsCount = result.totalCount;
            this.primengTableHelper.hideLoadingIndicator();
        });
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
    }


    invoiceRevision(id: number): void {
        this._router.navigate(['/app/main/invoicerevision', id]);
    }

}
