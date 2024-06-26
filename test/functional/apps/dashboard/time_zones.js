/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import path from 'path';
import expect from '@osd/expect';

export default function ({ getService, getPageObjects }) {
  const pieChart = getService('pieChart');
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const PageObjects = getPageObjects([
    'dashboard',
    'timePicker',
    'settings',
    'common',
    'savedObjects',
  ]);

  describe('dashboard time zones', function () {
    this.tags('includeFirefox');

    before(async () => {
      await opensearchArchiver.load('dashboard/current/opensearch_dashboards');
      await opensearchDashboardsServer.uiSettings.replace({
        defaultIndex: '0bf35f60-3dc9-11e8-8660-4d65aa086b3c',
      });
      await PageObjects.settings.navigateTo();
      await PageObjects.settings.clickOpenSearchDashboardsSavedObjects();
      await PageObjects.savedObjects.importFile(
        path.join(__dirname, 'exports', 'timezonetest_6_2_4.json'),
        true,
        true
      );
      await PageObjects.savedObjects.checkImportSucceeded();
      await PageObjects.common.navigateToApp('dashboard');
      await PageObjects.dashboard.preserveCrossAppState();
      await PageObjects.dashboard.loadSavedDashboard('time zone test');
    });

    after(async () => {
      await opensearchDashboardsServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });
    });

    it('Exported dashboard adjusts EST time to UTC', async () => {
      const time = await PageObjects.timePicker.getTimeConfigAsAbsoluteTimes();
      expect(time.start).to.be('Apr 10, 2018 @ 03:00:00.000');
      expect(time.end).to.be('Apr 10, 2018 @ 04:00:00.000');
      await pieChart.expectPieSliceCount(4);
    });

    it('Changing timezone changes dashboard timestamp and shows the same data', async () => {
      await PageObjects.settings.navigateTo();
      await PageObjects.settings.clickOpenSearchDashboardsSettings();
      await PageObjects.settings.setAdvancedSettingsSelect('dateFormat:tz', 'Etc/GMT+5');
      await PageObjects.common.navigateToApp('dashboard');
      await PageObjects.dashboard.loadSavedDashboard('time zone test');
      const time = await PageObjects.timePicker.getTimeConfigAsAbsoluteTimes();
      expect(time.start).to.be('Apr 9, 2018 @ 22:00:00.000');
      expect(time.end).to.be('Apr 9, 2018 @ 23:00:00.000');
      await pieChart.expectPieSliceCount(4);
    });
  });
}
