import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { BillingGuideLineDto, BillingGuideLineServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-billingguideline',
    templateUrl: './billingguideline.component.html',
    animations: [appModuleAnimation()]
})
export class BillingguidelineComponent extends AppComponentBase implements OnInit {

    guideLine: BillingGuideLineDto;
    saving: boolean;

    booleanFields = [
        { Name: 'blockBillingOn', DisplayName: 'Block Billing On' },
        { Name: 'clericalAdministrativeOn', DisplayName: 'Clerical Administrative On' },
        { Name: 'largeIncrementsOfTimeOn', DisplayName: 'Large Increments Of Time On' },
        { Name: 'longDaysOn', DisplayName: 'Long Days On' },
        { Name: 'patternEntryOn', DisplayName: 'Pattern Entry On' },
        { Name: 'legalResearchOn', DisplayName: 'Legal Research On' },
        { Name: 'trainingOn', DisplayName: 'Training On' },
        { Name: 'supervisionOn', DisplayName: 'Supervision On' },
        { Name: 'statusUpdateOn', DisplayName: 'Status Update On' },
        { Name: 'reviewOfFileOn', DisplayName: 'Review Of File On' },
        { Name: 'mathErrorOn', DisplayName: 'Math Error On' },
        { Name: 'legalResearchExpenseOn', DisplayName: 'Legal Research Expense On' },
        { Name: 'billingForBillingOn', DisplayName: 'Billing For Billing On' },
        { Name: 'postagExpenseOn', DisplayName: 'Postage Expense On' },
        { Name: 'scanningOn', DisplayName: 'Scanning On' },
        { Name: 'photocopyingOn', DisplayName: 'Photocopying On' },
        { Name: 'overtimeOn', DisplayName: 'Overtime On' },
        { Name: 'travelEntryOn', DisplayName: 'Travel Entry On' },
        { Name: 'vagueFeeEntryOn', DisplayName: 'Vague Fee Entry On' },
        { Name: 'vagueCommunicationOn', DisplayName: 'Vague Communication On' },
        { Name: 'inappropriateTimekeeperOn', DisplayName: 'Inappropriate Timekeeper On' },
        { Name: 'duplicateEntryOn', DisplayName: 'Duplicate Entry On' },
        { Name: 'telephoneChargesOn', DisplayName: 'Telephone Charges On' },
        { Name: 'faxChargesOn', DisplayName: 'Fax Charges On' },
        { Name: 'localTravelExpenseOn', DisplayName: 'Local Travel Expense On' },
        { Name: 'overtimeMealsOn', DisplayName: 'Overtime Meals On' },
        { Name: 'officeMealsOn', DisplayName: 'Office Meals On' },
        { Name: 'lateNightTransportationOn', DisplayName: 'Late Night Transportation On' },
        { Name: 'firstClassAirfareOn', DisplayName: 'First Class Airfare On' },
        { Name: 'eDiscoveryOn', DisplayName: 'E Discovery On' },
        { Name: 'miscelaneousOn', DisplayName: 'Miscellaneous On' },
    ];

    numberFields = [
        { Name: 'longDaysMaximum', DisplayName: 'Long Days Maximum' },
        { Name: 'legalResearchHoursMax', DisplayName: 'Legal Research Hours Max' },
        { Name: 'largeTimeIncrement', DisplayName: 'Large Time Increment' },
        { Name: 'blockBillingLimit', DisplayName: 'Block Billing Limit' },
        { Name: 'duplicateWordLimit', DisplayName: 'Duplicate Word Limit' },
        { Name: 'duplicateOccurenceLimit', DisplayName: 'Duplicate Occurence Limit' },
    ];


    constructor(
        injector: Injector,
        private _billingGuideLineService: BillingGuideLineServiceProxy
    ) {
        super(injector);
        this.guideLine = new BillingGuideLineDto();
        this.saving = false;
    }

    ngOnInit(): void {
        this.getBillingGuideLine();
    }

    getBillingGuideLine(): void {
        this._billingGuideLineService.getBillingGuideLine()
            .subscribe((result) => {
                this.guideLine = result;
            });
    }

    save(): void {
        this.saving = true;
        this._billingGuideLineService.editBillingGuideLine(this.guideLine)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
            });
    }
}