import { Component, OnInit } from '@angular/core';
import { ClSchedule, ClScheduleService } from '../services/cl-schedule.service';
import { Loan, LoanService } from '../services/loan.service';

@Component({
  selector: 'app-cl-schedule',
  templateUrl: './cl-schedule.component.html',
  styleUrls: ['./cl-schedule.component.css']
})
export class ClScheduleComponent implements OnInit {

  loanList: Loan[] = [];
  scheduleList: ClSchedule[] = [];

  selectedLoanId: number | null = null;

  loading = false;

  constructor(
    private clScheduleService: ClScheduleService,
    private loanService: LoanService
  ) {}

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.loanService.getAll().subscribe({
      next: (data) => {
        this.loanList = data;
      },
      error: (error) => {
        console.error(error);
        alert('Failed to load loans');
      }
    });
  }

  generateSchedule(): void {

    if (!this.selectedLoanId) {
      alert('Please select Loan first');
      return;
    }

    this.loading = true;

    this.clScheduleService.getByLoanId(this.selectedLoanId).subscribe({
  next: (existing) => {

    if (existing.length > 0) {
      this.scheduleList = existing;
      alert('Schedule already generated for this loan.');
      return;
    }

    this.clScheduleService
      .generateSchedule(this.selectedLoanId!)
      .subscribe(data => {
        this.scheduleList = data;
      });
  }
});
  }
}