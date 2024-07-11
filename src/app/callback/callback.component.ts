import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  template: '<p>Authenticating...</p>'
})
export class CallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.authService.handleCallback(code).subscribe(
          response => {
            this.authService.setToken(response.access_token);
          },
          error => {
            console.error('Authentication failed', error);
          }
        );
      }
      this.router.navigate(['/landing']);
    });
  }
}