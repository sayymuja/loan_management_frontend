
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

interface AuditTransaction {
  transactionId?: number;
  transactionDate?: string;
  transactionType?: string;
  category?: string;
  approvalStatus?: string;
  amount?: number;
  remark?: string;
  referenceType?: string;
  referenceId?: number;
}

interface AuditEmi {
  repaymentId?: number;
  installmentNo?: number;
  installmentDate?: string;
  repaymentDate?: string;
  scheduledAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  principalAmount?: number;
  interestAmount?: number;
  penaltyAmount?: number;
  paymentStatus?: string;
  regularRepayment?: boolean;
  remark?: string;
}

interface AuditLoan {
  loanId?: number;
  loanGivenDate?: string;
  loanPurpose?: string;
  loanStatus?: string;
  interestType?: string;
  sanctionedAmount?: number;
  processingFee?: number;
  disbursedAmount?: number;
  interestRate?: number;
  repaymentPeriodMonths?: number;
  scheduledAmount?: number;
  totalPaid?: number;
  principalRecovered?: number;
  interestReceived?: number;
  penaltyReceived?: number;
  outstandingAmount?: number;
  installments?: AuditEmi[];
}

interface AuditWoman {
  womanId?: number;
  womanName?: string;
  husbandName?: string;
  mobileNo?: string;
  status?: string;
  totalLoanAmount?: number;
  totalPrincipalRecovered?: number;
  totalInterestPaid?: number;
  totalPenaltyPaid?: number;
  totalOutstanding?: number;
  loans?: AuditLoan[];
}

interface AuditGroup {
  groupId?: number;
  groupName?: string;
  villageName?: string;
  totalLoanDisbursement?: number;
  totalPrincipalRecovered?: number;
  totalInterestReceived?: number;
  totalPenaltyReceived?: number;
  totalOutstanding?: number;
  women?: AuditWoman[];
}

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

  fundReceived?: number;
  bankFundReceived?: number;
  loanRepayment?: number;
  otherIncome?: number;

  bankCharges?: number;
  smsCharges?: number;
  recordFees?: number;
  accountantExpense?: number;
  cmrcPayment?: number;
  kitExpense?: number;
  otherExpense?: number;
  transferToCmrc?: number;

  groups?: AuditGroup[];
  transactions?: AuditTransaction[];
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

  totalOpeningBalance?: number;
  totalReceipts?: number;
  totalPayments?: number;
  totalClosingBalance?: number;
  totalLoanDisbursement?: number;
  totalPrincipalRecovered?: number;
  totalInterestReceived?: number;
  totalPenaltyReceived?: number;
}

@Component({
  selector: 'app-audit-report',
  templateUrl: './audit-report.component.html',
  styleUrls: ['./audit-report.component.css']
})
export class AuditReportComponent implements OnInit {
  private readonly apiUrl =
    'http://localhost:8080/api/audit-report';

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

  readonly financialYears: number[] =
    this.buildFinancialYears();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReport();
  }

  get financialYearLabel(): string {
    return `${this.financialYear}-${String(
      this.financialYear + 1
    ).slice(-2)}`;
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

    return Array.from(
      unique,
      ([id, name]) => ({ id, name })
    );
  }

  loadReport(): void {
    this.loading = true;
    this.errorMessage = '';
    this.report = null;

    let params = new HttpParams()
      .set('reportType', this.reportType)
      .set('financialYear', String(this.financialYear));

    if (this.reportType === 'MONTHLY') {
      params = params.set(
        'month',
        String(this.selectedMonth)
      );
    }

    this.http.get<AuditReportResponse>(
      this.apiUrl,
      { params }
    ).subscribe({
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
            'Audit report API was not found. Check the Spring Boot endpoint.';
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
    // Apply the selected CMRC filter to the authorized response.
  }

  async exportExcel(): Promise<void> {
    if (!this.reportLines.length) {
      this.errorMessage =
        'There is no report data to export.';
      return;
    }

    this.errorMessage = '';

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      const addSheet = (
        name: string,
        rows: Record<string, unknown>[]
      ): void => {
        const worksheet = XLSX.utils.json_to_sheet(
          rows.length ? rows : [{ Information: 'No records found' }]
        );

        worksheet['!cols'] = this.calculateColumnWidths(rows);

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          name
        );
      };

      // 1. Financial Summary
      const financialRows = this.reportLines.map(
        (line, index) => ({
          'Sr. No.': index + 1,
          'CMRC ID': line.cmrcId,
          'CMRC': line.cmrcName,
          'Village': line.villageName,
          'VO/ALF ID': line.voAlfId,
          'VO/ALF': line.voAlfName,
          'Account No.': line.accountNo || '',
          'Opening Balance': this.number(line.openingBalance),
          'Receipts': this.number(line.receipts),
          'Payments': this.number(line.payments),
          'Closing Balance': this.number(line.closingBalance),
          'Fund Received': this.number(line.fundReceived),
          'Bank Fund Received': this.number(line.bankFundReceived),
          'Loan Repayment': this.number(line.loanRepayment),
          'Other Income': this.number(line.otherIncome),
          'Loan Disbursement': this.number(line.loanDisbursement),
          'Principal Recovered': this.number(line.principalRecovered),
          'Interest Received': this.number(line.interestReceived),
          'Penalty Received': this.number(line.penaltyReceived),
          'Bank Charges': this.number(line.bankCharges),
          'SMS Charges': this.number(line.smsCharges),
          'Record Fees': this.number(line.recordFees),
          'Accountant Expense': this.number(line.accountantExpense),
          'CMRC Payment': this.number(line.cmrcPayment),
          'Kit Expense': this.number(line.kitExpense),
          'Other Expense': this.number(line.otherExpense),
          'Transfer to CMRC': this.number(line.transferToCmrc),
          'VO/ALF Current Balance':
            this.number(line.currentVoAlfBalance),
          'Fund Account Balance':
            this.number(line.fundAccountBalance),
          'Pending Approvals':
            this.number(line.pendingApprovals),
          'Audit Exceptions':
            (line.exceptions || []).join('; ')
        })
      );

      addSheet('Financial Summary', financialRows);

      // 2. Groups and Women
      const groupRows: Record<string, unknown>[] = [];

      this.reportLines.forEach(line => {
        (line.groups || []).forEach(group => {
          (group.women || []).forEach(woman => {
            groupRows.push({
              'CMRC': line.cmrcName,
              'Village': group.villageName || line.villageName,
              'VO/ALF': line.voAlfName,
              'Group ID': group.groupId,
              'Group': group.groupName,
              'Woman ID': woman.womanId,
              'Woman Name': woman.womanName,
              'Husband Name': woman.husbandName,
              'Mobile No.': woman.mobileNo,
              'Woman Status': woman.status,
              'Total Loan Amount':
                this.number(woman.totalLoanAmount),
              'Principal Recovered':
                this.number(woman.totalPrincipalRecovered),
              'Interest Paid':
                this.number(woman.totalInterestPaid),
              'Penalty Paid':
                this.number(woman.totalPenaltyPaid),
              'Outstanding':
                this.number(woman.totalOutstanding)
            });
          });
        });
      });

      addSheet('Groups and Women', groupRows);

      // 3. Loan Details
      const loanRows: Record<string, unknown>[] = [];

      this.reportLines.forEach(line => {
        (line.groups || []).forEach(group => {
          (group.women || []).forEach(woman => {
            (woman.loans || []).forEach(loan => {
              loanRows.push({
                'CMRC': line.cmrcName,
                'Village': group.villageName || line.villageName,
                'VO/ALF': line.voAlfName,
                'Group': group.groupName,
                'Woman': woman.womanName,
                'Loan ID': loan.loanId,
                'Loan Given Date': loan.loanGivenDate || '',
                'Purpose': loan.loanPurpose || '',
                'Status': loan.loanStatus || '',
                'Interest Type': loan.interestType || '',
                'Sanctioned Amount':
                  this.number(loan.sanctionedAmount),
                'Processing Fee':
                  this.number(loan.processingFee),
                'Disbursed Amount':
                  this.number(loan.disbursedAmount),
                'Interest Rate':
                  this.number(loan.interestRate),
                'Repayment Period (Months)':
                  loan.repaymentPeriodMonths ?? '',
                'Scheduled Amount':
                  this.number(loan.scheduledAmount),
                'Total Paid':
                  this.number(loan.totalPaid),
                'Principal Recovered':
                  this.number(loan.principalRecovered),
                'Interest Received':
                  this.number(loan.interestReceived),
                'Penalty Received':
                  this.number(loan.penaltyReceived),
                'Outstanding':
                  this.number(loan.outstandingAmount)
              });
            });
          });
        });
      });

      addSheet('Loan Details', loanRows);

      // 4. EMI Details
      const emiRows: Record<string, unknown>[] = [];

      this.reportLines.forEach(line => {
        (line.groups || []).forEach(group => {
          (group.women || []).forEach(woman => {
            (woman.loans || []).forEach(loan => {
              (loan.installments || []).forEach(emi => {
                emiRows.push({
                  'CMRC': line.cmrcName,
                  'Village': group.villageName || line.villageName,
                  'VO/ALF': line.voAlfName,
                  'Group': group.groupName,
                  'Woman': woman.womanName,
                  'Loan ID': loan.loanId,
                  'Repayment ID': emi.repaymentId,
                  'Installment No.': emi.installmentNo,
                  'Installment Date': emi.installmentDate || '',
                  'Repayment Date': emi.repaymentDate || '',
                  'Scheduled Amount':
                    this.number(emi.scheduledAmount),
                  'Paid Amount': this.number(emi.paidAmount),
                  'Remaining Amount':
                    this.number(emi.remainingAmount),
                  'Principal Amount':
                    this.number(emi.principalAmount),
                  'Interest Amount':
                    this.number(emi.interestAmount),
                  'Penalty Amount':
                    this.number(emi.penaltyAmount),
                  'Payment Status': emi.paymentStatus || '',
                  'Regular Repayment':
                    emi.regularRepayment ?? '',
                  'Remark': emi.remark || ''
                });
              });
            });
          });
        });
      });

      addSheet('EMI Details', emiRows);

      // 5. Approved transactions returned by the backend
      const transactionRows: Record<string, unknown>[] = [];

      this.reportLines.forEach(line => {
        (line.transactions || []).forEach(tx => {
          transactionRows.push({
            'CMRC': line.cmrcName,
            'Village': line.villageName,
            'VO/ALF': line.voAlfName,
            'Transaction ID': tx.transactionId,
            'Transaction Date': tx.transactionDate || '',
            'Transaction Type': tx.transactionType || '',
            'Category': tx.category || '',
            'Amount': this.number(tx.amount),
            'Approval Status': tx.approvalStatus || '',
            'Reference Type': tx.referenceType || '',
            'Reference ID': tx.referenceId ?? '',
            'Remark': tx.remark || ''
          });
        });
      });

      addSheet('Transactions', transactionRows);

      // 6. Audit Exceptions
      const exceptionRows: Record<string, unknown>[] = [];

      this.reportLines.forEach(line => {
        (line.exceptions || []).forEach(exception => {
          exceptionRows.push({
            'CMRC': line.cmrcName,
            'Village': line.villageName,
            'VO/ALF': line.voAlfName,
            'Exception': exception
          });
        });

        if (
          this.number(line.currentVoAlfBalance) !==
          this.number(line.fundAccountBalance)
        ) {
          exceptionRows.push({
            'CMRC': line.cmrcName,
            'Village': line.villageName,
            'VO/ALF': line.voAlfName,
            'Exception':
              'VO/ALF balance differs from Fund Account balance'
          });
        }
      });

      (this.report?.exceptions || []).forEach(exception => {
        exceptionRows.push({
          'CMRC': '',
          'Village': '',
          'VO/ALF': '',
          'Exception': exception
        });
      });

      if (this.report?.pendingApprovals) {
        exceptionRows.push({
          'CMRC': '',
          'Village': '',
          'VO/ALF': '',
          'Exception':
            `Report contains ${this.report.pendingApprovals} pending approval(s).`
        });
      }

      addSheet('Audit Exceptions', exceptionRows);

      const filename =
        `Comprehensive_Audit_${this.reportType}_${this.financialYearLabel}.xlsx`;

      XLSX.writeFile(workbook, filename);

    } catch (error) {
      console.error('Audit Excel export failed:', error);
      this.errorMessage =
        'Excel export failed. Check that the xlsx package is installed.';
    }
  }

  printReport(): void {
    if (!this.reportLines.length) {
      this.errorMessage =
        'There is no report data to print.';
      return;
    }

    window.print();
  }

  formatCurrency(
    value: number | undefined | null
  ): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(this.number(value));
  }

  private sum(field: keyof AuditLine): number {
    return this.reportLines.reduce(
      (total, line) =>
        total + this.number(line[field] as number),
      0
    );
  }

  private number(
    value: number | undefined | null
  ): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private calculateColumnWidths(
    rows: Record<string, unknown>[]
  ): { wch: number }[] {
    if (!rows.length) {
      return [{ wch: 24 }];
    }

    const headers = Object.keys(rows[0]);

    return headers.map(header => {
      const maxValueLength = rows.reduce(
        (max, row) => Math.max(
          max,
          String(row[header] ?? '').length
        ),
        header.length
      );

      return {
        wch: Math.min(Math.max(maxValueLength + 2, 12), 36)
      };
    });
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

    for (
      let year = currentStart;
      year >= currentStart - 5;
      year--
    ) {
      years.push(year);
    }

    return years;
  }
}
