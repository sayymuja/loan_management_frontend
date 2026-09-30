import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  showLayout: boolean = true;

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {

    this.updateLayout(this.router.url);

    this.router.events
      .pipe(
        filter(
          event => event instanceof NavigationEnd
        )
      )
      .subscribe(
        (event: any) => {

          this.updateLayout(
            event.urlAfterRedirects
          );

        }
      );
  }


  private updateLayout(url: string): void {

    /*
     * Login and Signup pages:
     * Sidebar + Topbar hidden
     */
    if (
      url.startsWith('/login') ||
      url.startsWith('/signup')
    ) {
      this.showLayout = false;
    }

    /*
     * All other pages:
     * Sidebar + Topbar visible
     */
    else {
      this.showLayout = true;
    }
  }

}