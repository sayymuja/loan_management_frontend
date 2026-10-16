
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

interface AuditLine {
  cmrcId: number;
  cmrcName: string;
  villageName: string;
  voAlfId: number;
  voAlfName: string;
  accountNo?: string;

  openingBalance: number;
  receipts: number;
  payments: number;
  closingBalance: number;

  loanDisbursement: number;
  principalRecovered: number;
  interestReceived: number;
  penaltyReceived: number;

  currentVoAlfBalance?: number;
  fundAccountBalance?: number;
  pendingApprovals?: number;
  exceptions?: string[];
}

interface AuditReportResponse {
  reportTitle: string;
  periodLabel: string;
  generatedAt: string;
  lines: AuditLine[];
  exceptions: string[];
  pendingApprovals: number;
  isReconciled: boolean;
  message?: string;
}

@Component({
  selector: 'app-audit-report',
  templateUrl: './audit-report.component.html',
  styleUrls: ['./audit-report.component.css']
})
export class AuditReportComponent implements OnInit {
  private readonly apiUrl = 'http://localhost:8080/api/audit-report';

  reportType: 'MONTHLY' | 'YEARLY' = 'MONTHLY';
  financialYear = this.getCurrentFinancialYearStart();
  selectedMonth = new Date().getMonth() + 1;
  selectedCmrcId = 'ALL';

  loading = false;
  errorMessage = '';
  report: AuditReportResponse | null = null;

  readonly months = [
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' }
  ];

  readonly financialYears: number[] = this.buildFinancialYears();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReport();
  }

  get financialYearLabel(): string {
    return `${this.financialYear}-${String(this.financialYear + 1).slice(-2)}`;
  }

  get reportLines(): AuditLine[] {
    const lines = this.report?.lines || [];

    if (this.selectedCmrcId === 'ALL') {
      return lines;
    }

    return lines.filter(
      line => String(line.cmrcId) === this.selectedCmrcId
    );
  }

  get totalOpening(): number {
    return this.sum('openingBalance');
  }

  get totalReceipts(): number {
    return this.sum('receipts');
  }

  get totalPayments(): number {
    return this.sum('payments');
  }

  get totalClosing(): number {
    return this.sum('closingBalance');
  }

  get totalDisbursement(): number {
    return this.sum('loanDisbursement');
  }

  get totalPrincipalRecovered(): number {
    return this.sum('principalRecovered');
  }

  get totalInterest(): number {
    return this.sum('interestReceived');
  }

  get totalPenalty(): number {
    return this.sum('penaltyReceived');
  }

  get cmrcOptions(): { id: string; name: string }[] {
    const unique = new Map<string, string>();

    (this.report?.lines || []).forEach(line => {
      unique.set(String(line.cmrcId), line.cmrcName);
    });

    return Array.from(unique, ([id, name]) => ({ id, name }));
  }

  loadReport(): void {
    this.loading = true;
    this.errorMessage = '';
    this.report = null;

    let params = new HttpParams()
      .set('reportType', this.reportType)
      .set('financialYear', String(this.financialYear));

    if (this.reportType === 'MONTHLY') {
      params = params.set('month', String(this.selectedMonth));
    }

    this.http.get<AuditReportResponse>(this.apiUrl, { params })
      .subscribe({
        next: response => {
          this.report = response;
          this.loading = false;
        },
        error: error => {
          this.loading = false;

          if (error.status === 401 || error.status === 403) {
            this.errorMessage =
              'You are not authorized to view this audit report.';
          } else if (error.status === 404) {
            this.errorMessage =
              'Audit report API is not available yet. Add the Spring Boot endpoint /api/audit-report.';
          } else {
            this.errorMessage =
              'Unable to load the audit report. Check the backend server and try again.';
          }
        }
      });
  }

  onReportTypeChange(): void {
    this.loadReport();
  }

  onFinancialYearChange(): void {
    this.loadReport();
  }

  onMonthChange(): void {
    this.loadReport();
  }

  onCmrcChange(): void {
    // CMRC filter is applied locally to the already authorized response.
  }

  exportExcel(): void {
    if (!this.reportLines.length) {
      this.errorMessage = 'There is no report data to export.';
      return;
    }

    import('xlsx').then(XLSX => {
      const rows = this.reportLines.map((line, index) => ({
        'Sr. No.': index + 1,
        'CMRC': line.cmrcName,
        'Village': line.villageName,
        'VO / ALF': line.voAlfName,
        'Account No.': line.accountNo || '',
        'Opening Balance': this.number(line.openingBalance),
        'Receipts': this.number(line.receipts),
        'Payments': this.number(line.payments),
        'Closing Balance': this.number(line.closingBalance),
        'Loan Disbursement': this.number(line.loanDisbursement),
        'Principal Recovered': this.number(line.principalRecovered),
        'Interest Received': this.number(line.interestReceived),
        'Penalty Received': this.number(line.penaltyReceived),
        'VO / ALF Current Balance':
          this.number(line.currentVoAlfBalance),
        'Fund Account Balance':
          this.number(line.fundAccountBalance),
        'Pending Approvals': this.number(line.pendingApprovals),
        'Audit Exceptions': (line.exceptions || []).join('; ')
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Report');

      const filename =
        `Comprehensive_Audit_${this.reportType}_${this.financialYearLabel}.xlsx`;

      XLSX.writeFile(workbook, filename);
    }).catch(() => {
      this.errorMessage = 'Excel export failed. Please try again.';
    });
  }

  printReport(): void {
    if (!this.reportLines.length) {
      this.errorMessage = 'There is no report data to print.';
      return;
    }

    window.print();
  }

  formatCurrency(value: number | undefined | null): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(this.number(value));
  }

  private sum(field: keyof AuditLine): number {
    return this.reportLines.reduce(
      (total, line) => total + this.number(line[field] as number),
      0
    );
  }

  private number(value: number | undefined | null): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getCurrentFinancialYearStart(): number {
    const now = new Date();
    return now.getMonth() >= 3
      ? now.getFullYear()
      : now.getFullYear() - 1;
  }

  private buildFinancialYears(): number[] {
    const currentStart = this.getCurrentFinancialYearStart();
    const years: number[] = [];

    for (let year = currentStart; year >= currentStart - 5; year--) {
      years.push(year);
    }

    return years;
  }
}
