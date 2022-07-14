import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'garage-sample',
  templateUrl: './sample.component.html',
  styleUrls: ['./sample.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SampleComponent implements OnInit {
  constructor() {
    // add something later
  }

  ngOnInit(): void {
    // fix me later
    console.log('init');
  }
}
