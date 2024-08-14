import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  template: '<p>Authenticating...</p>'
})
export class CallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService, private message: NzMessageService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.authService.handleCallback(code).subscribe(
          response => this.authService.setToken(response.access_token),
          error => this.message.error('Authentication failed')
        );
      }
      this.router.navigate(['/landing']);
    });
  }
}