import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


// =========================================================
// LOAN INTERFACE
// =========================================================

export interface Loan {
  id?: number;

  cmrcId?: number;
  cmrcName?: string;

  voAlfId?: number;
  voAlfName?: string;

  groupId?: number;
  groupName?: string;
  villageName?: string;

  womanId?: number;
  womanName?: string;

  sanctionedAmount?: number;
  processingFee?: number;

  // ADD THIS
  totalAmount?: number;

  loanAmount?: number;

  loanPurpose?: string;
  loanGivenDate?: string;

  repaymentPeriodMonths?: number;
  interestRate?: number;
  interestType?: string;
  monthlyEmi?: number;

  loanStatus?: string;

  totalInterestReceived?: number;
}


// =========================================================
// LOAN IMAGE INTERFACE
// =========================================================

export interface LoanImage {

  id?: number;

  loanId?: number;

  fileName?: string;

  contentType?: string;

  fileSize?: number;

  viewUrl?: string;

  downloadUrl?: string;

  uploadedAt?: string;
}


// =========================================================
// SERVICE
// =========================================================

@Injectable({
  providedIn: 'root'
})
export class LoanService {

  private apiUrl =
    'http://localhost:8080/api/loan';

  private imageApiUrl =
    'http://localhost:8080/api/loan-images';


  constructor(
    private http: HttpClient
  ) {}


  // =========================================================
  // GET ALL
  // =========================================================

  getAll(): Observable<Loan[]> {

    return this.http.get<Loan[]>(
      this.apiUrl
    );
  }


  // =========================================================
  // GET BY ID
  // =========================================================

  getById(
    id: number
  ): Observable<Loan> {

    return this.http.get<Loan>(
      `${this.apiUrl}/${id}`
    );
  }


  // =========================================================
  // GET LOANS BY WOMAN
  // =========================================================

  getByWomanId(
    womanId: number
  ): Observable<Loan[]> {

    return this.http.get<Loan[]>(
      `${this.apiUrl}/woman/${womanId}`
    );
  }


  // =========================================================
  // CREATE
  // =========================================================

  create(
    loan: Loan
  ): Observable<Loan> {

    return this.http.post<Loan>(
      this.apiUrl,
      loan
    );
  }


  // =========================================================
  // UPDATE
  // =========================================================

  update(
    id: number,
    loan: Loan
  ): Observable<Loan> {

    return this.http.put<Loan>(
      `${this.apiUrl}/${id}`,
      loan
    );
  }


  // =========================================================
  // DELETE
  // =========================================================

  delete(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }


  // =========================================================
  // GENERATE CL SCHEDULE
  // =========================================================

  generateClSchedule(
    loanId: number
  ): Observable<any[]> {

    return this.http.post<any[]>(
      `http://localhost:8080/api/cl-schedule/generate/${loanId}`,
      {}
    );
  }


  // =========================================================
  // GENERATE REPAYMENT
  // =========================================================

  generateRepayment(
    loanId: number
  ): Observable<any[]> {

    return this.http.post<any[]>(
      `http://localhost:8080/api/repayment/generate/${loanId}`,
      {}
    );
  }


  // =========================================================
  // GET LOANS BY VO / ALF
  // =========================================================

  getByVoAlfId(
    voAlfId: number
  ): Observable<Loan[]> {

    return this.http.get<Loan[]>(
      `${this.apiUrl}/vo-alf/${voAlfId}`
    );
  }


  // =========================================================
  // GET LOANS BY GROUP
  // =========================================================

  getByGroupId(
    groupId: number
  ): Observable<Loan[]> {

    return this.http.get<Loan[]>(
      `${this.apiUrl}/group/${groupId}`
    );
  }


  // =========================================================
  // LOAN IMAGE - UPLOAD
  // =========================================================

  uploadImages(
    loanId: number,
    files: File[]
  ): Observable<LoanImage[]> {

    const formData =
      new FormData();

    files.forEach(
      (file: File) => {

        formData.append(
          'files',
          file
        );

      }
    );

    return this.http.post<LoanImage[]>(
      `${this.imageApiUrl}/upload/${loanId}`,
      formData
    );
  }


  // =========================================================
  // LOAN IMAGE - GET BY LOAN
  // =========================================================

  getImagesByLoan(
    loanId: number
  ): Observable<LoanImage[]> {

    return this.http.get<LoanImage[]>(
      `${this.imageApiUrl}/loan/${loanId}`
    );
  }


  // =========================================================
  // LOAN IMAGE - VIEW URL
  // =========================================================

  getImageViewUrl(
    imageId: number
  ): string {

    return `${this.imageApiUrl}/view/${imageId}`;
  }


  // =========================================================
  // LOAN IMAGE - DOWNLOAD URL
  // =========================================================

  getImageDownloadUrl(
    imageId: number
  ): string {

    return `${this.imageApiUrl}/download/${imageId}`;
  }


  // =========================================================
  // LOAN IMAGE - DELETE
  // =========================================================

  deleteImage(
    imageId: number
  ): Observable<any> {

    return this.http.delete<any>(
      `${this.imageApiUrl}/${imageId}`
    );
  }
}