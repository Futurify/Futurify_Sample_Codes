import { AddCommentModalComponent } from './add-comment-modal/add-comment-modal.component';
import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import * as _ from 'lodash';
import { Table } from 'primeng/components/table/table';
import { ActivatedRoute, Router } from '@angular/router';
import { LazyLoadEvent } from 'primeng/primeng';
import { Paginator } from 'primeng/components/paginator/paginator';
import { MatterServiceProxy, MatterListDto } from '@shared/service-proxies/service-proxies';
import { CreateOrEditMatterModalComponent } from './create-or-edit-matter-modal/create-or-edit-matter-modal.component';


@Component({
  selector: 'app-matter',
  templateUrl: './matter.component.html',
  animations: [appModuleAnimation()]
})
export class MatterComponent extends AppComponentBase implements OnInit {

  @ViewChild('dataTable') dataTable: Table;
  @ViewChild('paginator') paginator: Paginator;
  @ViewChild('createOrEditMatterModal') createOrEditMatterModal: CreateOrEditMatterModalComponent;


  filterText = '';
  workingStatus = 0;
  matters: MatterListDto[] = [];
  columns: any[];
  statuses: {};
  workingStatuses: {};
  statusClass: {};
  workingStatusArr: any[];

  constructor(
    injector: Injector,
    private _matterService: MatterServiceProxy,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
  ) {
    super(injector);
    this.filterText = this._activatedRoute.snapshot.queryParams['filterText'] || '';

    this.workingStatusArr = [
      { value: '2', text: 'All matters' },
      { value: '0', text: 'Open' },
      { value: '1', text: 'Closed' },
    ];



    this.statusClass = {
      '0': 'm-badge--brand',
      '1': 'm-badge--info',
      '2': 'm-badge--danger',
    };

  }

  ngOnInit(): void {

    this.statuses = {
      '0': 'Pending',
      '1': 'Approved',
      '2': 'Rejected'
    };
    this.workingStatuses = {
      '0': 'Open',
      '1': 'Closed'
    };
    this.columns = [
      { field: 'clientMatterNumber', header: 'Client Matter Number', sort: 'clientMatterNumber' },
      { field: 'clientMatterName', header: 'Client Matter Name', sort: 'clientMatterName' },
      { field: 'firmMatterNumber', header: 'Firm Matter Number', sort: 'firmMatterNumber' },
      { field: 'firmMatterName', header: 'Firm Matter Name', sort: 'firmMatterName' },
      { field: 'firmName', header: 'Firm', sort: 'firmId' },
      { field: 'creationTime', header: 'CreationTime', sort: 'creationTime' },
    ];


  }

  getMatters(event?: LazyLoadEvent) {
    if (this.primengTableHelper.shouldResetPaging(event)) {
      this.paginator.changePage(0);
      return;
    }

    this.primengTableHelper.showLoadingIndicator();

    this._matterService.getMattersPaging(
      this.filterText,
      this.workingStatus,
      this.primengTableHelper.getSorting(this.dataTable),
      this.primengTableHelper.getMaxResultCount(this.paginator, event),
      this.primengTableHelper.getSkipCount(this.paginator, event)
    ).subscribe(result => {
      this.primengTableHelper.totalRecordsCount = result.totalCount;
      this.primengTableHelper.records = result.items;
      this.primengTableHelper.hideLoadingIndicator();
    });
  }

  reloadPage(): void {
    this.paginator.changePage(this.paginator.getPage());
  }

  matterDetail(id: number) {
    this._router.navigate(['/app/main/matterdetail', id]);
  }


  deleteMatter(matter: MatterListDto): void {
    this.message.confirm(
      this.l('MatterDeleteWarningMessage', matter.clientMatterName),
      this.l('AreYouSure'),
      (isConfirmed) => {
        if (isConfirmed) {
          this._matterService.deleteMatter(matter.id)
            .subscribe(() => {
              this.reloadPage();
              this.notify.success(this.l('SuccessfullyDeleted'));
            });
        }
      }
    );
  }

  pendingChanges(matterId: number): void {
    this._router.navigate(['/app/main/pendingchangestimekeeper', matterId]);
  }


  changeWorkingStatus(matter: MatterListDto): void {

    let message = matter.workingStatus === 0 ? 'close' : 're-open';

    this.message.confirm(
      this.l('Are you sure you want to ' + message + ' matter ' + matter.clientMatterName + '?'),
      this.l('AreYouSure'),
      (isConfirmed) => {
        if (isConfirmed) {
          this._matterService.changeWorkingStatus(matter.id)
            .subscribe(() => {
              this.reloadPage();
              this.notify.info(this.l('Successfully Saved'));
            });
        }
      }
    );
  }


}
